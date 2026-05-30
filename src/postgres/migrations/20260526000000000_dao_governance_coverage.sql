-- Up Migration
-- Expanded DAODAO indexing coverage.
-- Adds: pause state, subDAOs, proposal/vote hooks, staking claims (cw20 /
-- native / cw721), pre-propose-approval lifecycle, and multi-choice vote
-- shape support.
--
-- All new tables are additive; the only change to an existing table is a
-- new nullable column on dao_core (`paused_until`).

-- ==========================================================================
-- DAO CORE: pause state
-- ==========================================================================
-- `execute_pause` sets a future expiration; while now() < paused_until the
-- DAO refuses to dispatch proposal-execute messages. NULL = never paused
-- (or pause has expired and no row was written). We keep this as a
-- timestamp instead of a boolean so the frontend can show "paused until X"
-- without an extra query. Cleared back to NULL when an Unpause is observed
-- (none in v2.0.2 — pause naturally expires by block time).
ALTER TABLE dao_core ADD COLUMN IF NOT EXISTS paused_until TIMESTAMP(3);

-- ==========================================================================
-- DAO SUB-DAOS — hierarchical DAO registrations
-- ==========================================================================
-- A DAO can declare other DAOs as its "subDAOs" via execute_update_sub_daos.
-- Storage on chain is `SUBDAO_LIST: Map<Addr, Option<String>>`. The Option
-- is a free-form charter string the parent DAO chose to attach. We mirror
-- it 1:1 — the FK on dao_address points at the parent; we DON'T FK on
-- sub_dao_address because the child DAO may live on another chain or may
-- not have been instantiated through dao-core yet (the parent can register
-- arbitrary addresses).
CREATE TABLE dao_sub_dao (
    dao_address TEXT NOT NULL,
    sub_dao_address TEXT NOT NULL,
    charter TEXT,
    updated_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL,
    PRIMARY KEY (dao_address, sub_dao_address),
    FOREIGN KEY (dao_address) REFERENCES dao_core(address)
);
CREATE INDEX dao_sub_dao_dao_address_idx ON dao_sub_dao(dao_address);
CREATE INDEX dao_sub_dao_sub_dao_address_idx ON dao_sub_dao(sub_dao_address);

-- ==========================================================================
-- PROPOSAL HOOKS — listeners notified on proposal status changes
-- ==========================================================================
-- add_proposal_hook / remove_proposal_hook on dao-proposal-{single,multiple,
-- condorcet}. Hook contracts subscribe so they can react (e.g. tally side
-- votes on other chains, mint NFTs on execution, etc.). We index for
-- visibility / audit; the chain holds the authoritative list.
CREATE TABLE dao_proposal_hook (
    proposal_module TEXT NOT NULL,
    hook_address TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL,
    PRIMARY KEY (proposal_module, hook_address),
    FOREIGN KEY (proposal_module) REFERENCES dao_proposal_module(address)
);
CREATE INDEX dao_proposal_hook_module_idx ON dao_proposal_hook(proposal_module);

-- ==========================================================================
-- VOTE HOOKS — listeners notified on every vote cast
-- ==========================================================================
CREATE TABLE dao_vote_hook (
    proposal_module TEXT NOT NULL,
    hook_address TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL,
    PRIMARY KEY (proposal_module, hook_address),
    FOREIGN KEY (proposal_module) REFERENCES dao_proposal_module(address)
);
CREATE INDEX dao_vote_hook_module_idx ON dao_vote_hook(proposal_module);

-- ==========================================================================
-- STAKING CLAIMS — unbonding queue for cw20-stake / native-stake / cw721-stake
-- ==========================================================================
-- When an unstake fires with a non-None claim_duration, the contract pushes
-- a Claim into its internal CLAIMS queue. The user must call `claim` (cw20
-- + native) or `claim_nfts` (cw721) once releaseAt has passed. We index
-- each pending claim so frontends can show "X tokens pending, claimable
-- at Y".
--
-- Single table to keep query patterns symmetrical across the three
-- staking types. `staking_contract` is whatever contract owns the queue
-- (cw20-stake addr, voting-module addr for cw721/native). `kind`
-- disambiguates so we know how to interpret the amount/token_id columns
-- and which contract to expect calls on.
--
-- claim_id is a synthetic surrogate — no chain-side id exists for cw20/
-- native claims (they're keyed by (sender, release_at)), so we use a
-- BIGSERIAL and dedupe by (staking_contract, staker, kind, release_at,
-- amount/token_id) at insert time.
CREATE TABLE dao_staking_claim (
    id BIGSERIAL PRIMARY KEY,
    -- 'cw20' | 'native' | 'cw721'
    kind TEXT NOT NULL,
    staking_contract TEXT NOT NULL,
    staker_address TEXT NOT NULL,
    -- For cw20 / native: token amount (string for Uint128 precision).
    -- NULL for cw721 where amount is implicit (1 NFT per row, see token_id).
    amount NUMERIC,
    -- For cw721 only: the NFT token id being unbonded. NULL for cw20/native.
    token_id TEXT,
    -- Block timestamp when release becomes possible (claim_duration from
    -- the unstake event resolved against block time).
    release_at TIMESTAMP(3),
    -- Block height the unstake fired at (so re-orgs can find/replay).
    unstaked_at_height INTEGER NOT NULL,
    -- Set when the user calls `claim` and the claim is consumed; the row
    -- is kept rather than deleted so we have an audit trail of "claimed
    -- 100 IXO on day 14" instead of "row disappeared".
    claimed_at_height INTEGER,
    claimed_at TIMESTAMP(3)
);
CREATE INDEX dao_staking_claim_staker_idx
    ON dao_staking_claim(staker_address);
CREATE INDEX dao_staking_claim_contract_idx
    ON dao_staking_claim(staking_contract);
-- "Pending claims for staker X" — the dominant frontend query
CREATE INDEX dao_staking_claim_pending_idx
    ON dao_staking_claim(staker_address, release_at)
    WHERE claimed_at IS NULL;

-- ==========================================================================
-- PRE-PROPOSE APPROVAL — pending proposals awaiting approver action
-- ==========================================================================
-- dao-pre-propose-approval-single inserts a row in PENDING_PROPOSALS keyed
-- by an approval_id (separate from the eventual proposal_id). Approver
-- then either Approve(id) → row deleted on-chain, dao_proposal_module
-- gets a real proposal — or Reject(id) → row deleted on-chain, deposit
-- (if any) refunded per policy.
--
-- We mirror the on-chain lifecycle: row inserted on submit, status flipped
-- to 'approved'/'rejected' (kept rather than deleted so we have the
-- history). proposal_id is populated only on approval, carrying the
-- forward link to the real proposal that got created.
CREATE TABLE dao_pre_propose_approval (
    pre_propose_module TEXT NOT NULL,
    approval_id BIGINT NOT NULL,
    proposer TEXT NOT NULL,
    -- 'pending' | 'approved' | 'rejected'
    status TEXT NOT NULL DEFAULT 'pending',
    -- Only set on Approve — the proposal_id the proposal module assigned.
    proposal_id BIGINT,
    submitted_at TIMESTAMP(3) NOT NULL,
    submitted_at_height INTEGER NOT NULL,
    resolved_at TIMESTAMP(3),
    resolved_at_height INTEGER,
    PRIMARY KEY (pre_propose_module, approval_id),
    FOREIGN KEY (pre_propose_module) REFERENCES dao_pre_propose_module(address)
);
CREATE INDEX dao_pre_propose_approval_status_idx
    ON dao_pre_propose_approval(pre_propose_module, status);
CREATE INDEX dao_pre_propose_approval_proposer_idx
    ON dao_pre_propose_approval(proposer);

-- ==========================================================================
-- DAO VOTE — multi-choice tracking
-- ==========================================================================
-- The existing dao_vote.vote TEXT column already accepts either a
-- yes/no/abstain string (single-choice) or an option_id integer (multiple-
-- choice). The handler just needed to write the right value; no schema
-- change is required. We add an explicit comment so future readers don't
-- assume binary-only.
COMMENT ON COLUMN dao_vote.vote IS
  'For dao-proposal-single: ''yes''|''no''|''abstain''. For dao-proposal-multiple / -condorcet: the integer option_id as a string.';

-- ==========================================================================
-- DAODAO SNAPSHOT STATE — single-row tracker for the cosmwasm-cutoff snapshot
-- ==========================================================================
-- Background: the chain underwent an SDK/wasm upgrade at a known per-network
-- height (devnet 5,251,750; testnet 9,284,120; mainnet 9,269,290). Pre-upgrade
-- cosmwasm smart-queries panic against the archive node, so the daodao
-- indexer skips those events entirely. On crossing the cutoff for the first
-- time we walk every dao-core (and friends) contract in `wasm_instantiate`
-- and pull a fresh state snapshot via dump_state. That snapshot fills the
-- daodao tables enough that post-cutoff events have all the parent rows
-- they need to FK against.
--
-- This table records whether the snapshot has happened, so we don't redo it
-- on every restart. The CHECK (id=1) makes it a singleton.
CREATE TABLE daodao_snapshot_state (
    id INTEGER NOT NULL DEFAULT 1,
    network TEXT NOT NULL,
    cutoff_height INTEGER NOT NULL,
    snapshot_height INTEGER NOT NULL,
    started_at TIMESTAMP(3) NOT NULL,
    completed_at TIMESTAMP(3),
    -- Track contract counts so an operator can sanity-check the snapshot
    -- without running queries by hand
    dao_core_count INTEGER NOT NULL DEFAULT 0,
    voting_module_count INTEGER NOT NULL DEFAULT 0,
    proposal_module_count INTEGER NOT NULL DEFAULT 0,
    proposals_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT daodao_snapshot_state_pkey PRIMARY KEY (id),
    CONSTRAINT daodao_snapshot_state_singleton CHECK (id = 1)
);

-- Down Migration
-- DROP TABLE daodao_snapshot_state;
-- DROP INDEX dao_pre_propose_approval_proposer_idx;
-- DROP INDEX dao_pre_propose_approval_status_idx;
-- DROP TABLE dao_pre_propose_approval;
-- DROP INDEX dao_staking_claim_pending_idx;
-- DROP INDEX dao_staking_claim_contract_idx;
-- DROP INDEX dao_staking_claim_staker_idx;
-- DROP TABLE dao_staking_claim;
-- DROP INDEX dao_vote_hook_module_idx;
-- DROP TABLE dao_vote_hook;
-- DROP INDEX dao_proposal_hook_module_idx;
-- DROP TABLE dao_proposal_hook;
-- DROP INDEX dao_sub_dao_sub_dao_address_idx;
-- DROP INDEX dao_sub_dao_dao_address_idx;
-- DROP TABLE dao_sub_dao;
-- ALTER TABLE dao_core DROP COLUMN paused_until;
