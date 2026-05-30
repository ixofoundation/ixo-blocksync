-- Up Migration
-- Single-row tracker for the v7 chain-upgrade snapshot.
--
-- Background: the v7 chain upgrade handler does silent KV writes that the
-- indexer can't see via events (see src/constants/v7_upgrade.ts and
-- ixo-blockchain/app/upgrades/v7/migrations.go for the gory details):
--   - liquidstake: writes ModuleParams + the legacy "zero" Pool, re-keys
--     LiquidValidator entries under the new per-pool prefix.
--   - claims: stamps legacy Disputes (target_role=UNSPECIFIED) DISMISSED.
--
-- On crossing the upgrade height for the first time we mirror those
-- changes into the local DB. This table records that we've done so.
CREATE TABLE v7_snapshot_state (
    id INTEGER NOT NULL DEFAULT 1,
    network TEXT NOT NULL,
    upgrade_height INTEGER NOT NULL,
    snapshot_height INTEGER NOT NULL,
    started_at TIMESTAMP(3) NOT NULL,
    completed_at TIMESTAMP(3),
    -- Sanity counters so an operator can spot-check the snapshot result
    pools_count INTEGER NOT NULL DEFAULT 0,
    module_params_written BOOLEAN NOT NULL DEFAULT FALSE,
    -- Number of pre-v7 LiquidStakeTx rows whose poolId was empty and got
    -- rewritten to the legacy pool id.
    legacy_ls_tx_relinked INTEGER NOT NULL DEFAULT 0,
    -- Number of pre-v7 Dispute rows stamped DISMISSED.
    legacy_disputes_dismissed INTEGER NOT NULL DEFAULT 0,
    -- Number of ClaimCollection rows re-fetched for v7-field refresh.
    collections_refreshed INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT v7_snapshot_state_pkey PRIMARY KEY (id),
    CONSTRAINT v7_snapshot_state_singleton CHECK (id = 1)
);

-- Down Migration
-- DROP TABLE v7_snapshot_state;
