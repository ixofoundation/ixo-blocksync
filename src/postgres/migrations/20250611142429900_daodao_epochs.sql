-- Up Migration

-- =============================================
-- Wasm Instantiate Table
-- =============================================

CREATE TABLE wasm_instantiate (
  address TEXT PRIMARY KEY,
  code_id INTEGER,
  created_at TIMESTAMP(3) NOT NULL,
  block_height INTEGER NOT NULL,
  msg_index INTEGER
);

-- =============================================
-- DAO DAO Smart Contract Tables
-- =============================================

-- Core DAO Tables
CREATE TABLE dao_pre_propose_module (
    address TEXT PRIMARY KEY,
    proposal_module TEXT,
    deposit_info JSONB,
    open_proposal_submission BOOLEAN,
    created_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL
);

CREATE TABLE dao_proposal_module (
    address TEXT PRIMARY KEY,
    dao_address TEXT, -- Foreign Key added later
    module_type TEXT, -- 'single', 'multiple', 'condorcet'
    created_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL,
    pre_propose_module TEXT, -- Add pre-propose module directly for easier access
    proposal_creation_policy JSONB,
    config JSONB,
    FOREIGN KEY (pre_propose_module) REFERENCES dao_pre_propose_module(address)
);

CREATE TABLE dao_voting_module (
    address TEXT PRIMARY KEY,
    module_type TEXT, -- 'cw20-staked', 'cw721-staked', 'cw4', 'native-staked'
    token_address TEXT, -- For CW20 voting modules
    staking_contract TEXT, -- For CW20 voting modules
    group_contract_address TEXT, -- For CW4 voting modules
    total_weight NUMERIC, -- For CW4 voting modules and CW20 staked voting modules
    nft_contract TEXT, -- For CW721 voting modules
    native_denom TEXT, -- For native staking modules
    active_threshold JSONB, -- For CW20 staked voting modules
    unstaking_duration JSONB, -- For CW721 voting modules
    created_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL
);

CREATE TABLE dao_core (
    address TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    image_url TEXT,
    automatically_add_cw20s BOOLEAN,
    automatically_add_cw721s BOOLEAN,
    dao_uri TEXT,
    admin_address TEXT,
    created_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL,
    voting_module TEXT,
    FOREIGN KEY (voting_module) REFERENCES dao_voting_module(address)
);

-- Proposal Tables
CREATE TABLE dao_proposal (
    id BIGINT,
    proposal_module TEXT,
    title TEXT,
    description TEXT,
    proposer TEXT,
    start_height INTEGER,
    min_voting_period JSONB,
    expiration JSONB,
    threshold JSONB,
    total_power TEXT,
    allow_revoting BOOLEAN,
    msgs JSONB,
    status TEXT, -- 'open', 'passed', 'rejected', 'executed', 'closed', 'execution_failed'
    votes JSONB,
    created_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL,
    PRIMARY KEY (proposal_module, id),
    FOREIGN KEY (proposal_module) REFERENCES dao_proposal_module(address)
);

CREATE TABLE dao_vote (
    proposal_module TEXT,
    proposal_id BIGINT,
    voter TEXT,
    vote TEXT, -- 'yes', 'no', 'abstain', or option index for multiple choice
    power NUMERIC,
    rationale TEXT,
    voted_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL,
    PRIMARY KEY (proposal_module, proposal_id, voter),
    FOREIGN KEY (proposal_module, proposal_id) REFERENCES dao_proposal(proposal_module, id)
);

-- =============================================
-- Voting Module Type-Specific Tables
-- =============================================

CREATE TABLE dao_cw4_group_contract (
    address TEXT PRIMARY KEY
);

CREATE TABLE dao_cw20_staking_contract (
    address TEXT PRIMARY KEY
);

-- CW4 Group Members (linked to group_contract_address)
CREATE TABLE dao_cw4_member (
    group_contract_address TEXT,
    member_address TEXT,
    weight INTEGER NOT NULL,
    PRIMARY KEY (group_contract_address, member_address),
    FOREIGN KEY (group_contract_address) REFERENCES dao_cw4_group_contract(address)
);

-- CW20 Staking Contract Stakers (linked to staking_contract)
CREATE TABLE dao_cw20_staker (
    staking_contract TEXT,
    staker_address TEXT,
    staked_amount NUMERIC NOT NULL,
    PRIMARY KEY (staking_contract, staker_address),
    FOREIGN KEY (staking_contract) REFERENCES dao_cw20_staking_contract(address)
);

-- CW721 Staked NFTs (linked to voting_module_address)
CREATE TABLE dao_cw721_staker (
    voting_module_address TEXT,
    staker_address TEXT,
    token_id TEXT,
    PRIMARY KEY (voting_module_address, staker_address, token_id),
    FOREIGN KEY (voting_module_address) REFERENCES dao_voting_module(address)
);

-- Native Token Stakers (linked to voting_module_address)
CREATE TABLE dao_native_staker (
    voting_module_address TEXT,
    staker_address TEXT,
    staked_amount NUMERIC NOT NULL,
    PRIMARY KEY (voting_module_address, staker_address),
    FOREIGN KEY (voting_module_address) REFERENCES dao_voting_module(address)
);

-- =============================================
-- Foreign Keys
-- =============================================

ALTER TABLE dao_proposal_module ADD FOREIGN KEY (dao_address) REFERENCES dao_core(address);

-- Add foreign keys from voting modules to contract registries
ALTER TABLE dao_voting_module ADD CONSTRAINT fk_voting_module_group_contract
    FOREIGN KEY (group_contract_address) REFERENCES dao_cw4_group_contract(address);

ALTER TABLE dao_voting_module ADD CONSTRAINT fk_voting_module_staking_contract
    FOREIGN KEY (staking_contract) REFERENCES dao_cw20_staking_contract(address);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Core indexes
CREATE INDEX idx_dao_core_voting_module ON dao_core(voting_module);

-- Proposal module indexes
CREATE INDEX idx_dao_proposal_module_dao ON dao_proposal_module(dao_address);

-- Voting module indexes
CREATE INDEX idx_dao_voting_module_staking_contract ON dao_voting_module(staking_contract);

-- Proposal indexes
CREATE INDEX idx_dao_proposal_dao ON dao_proposal(id);
CREATE INDEX idx_dao_proposal_module ON dao_proposal(proposal_module);
CREATE INDEX idx_dao_proposal_proposer ON dao_proposal(proposer);

-- Vote indexes
CREATE INDEX idx_dao_vote_dao ON dao_vote(proposal_module);
CREATE INDEX idx_dao_vote_proposal ON dao_vote(proposal_id);
CREATE INDEX idx_dao_vote_voter ON dao_vote(voter);

-- Pre-propose indexes
CREATE INDEX idx_dao_pre_propose_proposal_module ON dao_pre_propose_module(proposal_module);

-- Type-specific voting module indexes
CREATE INDEX idx_dao_cw4_member_group ON dao_cw4_member(group_contract_address);
CREATE INDEX idx_dao_cw4_member_address ON dao_cw4_member(member_address);

CREATE INDEX idx_dao_cw20_staker_contract ON dao_cw20_staker(staking_contract);
CREATE INDEX idx_dao_cw20_staker_address ON dao_cw20_staker(staker_address);

CREATE INDEX idx_dao_cw721_staker_module ON dao_cw721_staker(voting_module_address);
CREATE INDEX idx_dao_cw721_staker_address ON dao_cw721_staker(staker_address);
CREATE INDEX idx_dao_cw721_staker_token ON dao_cw721_staker(token_id);

CREATE INDEX idx_dao_native_staker_module ON dao_native_staker(voting_module_address);
CREATE INDEX idx_dao_native_staker_address ON dao_native_staker(staker_address);

-- =============================================
-- Message Table
-- =============================================

ALTER TABLE "Message" ADD COLUMN "index" INTEGER;

-- =============================================
-- Epoch Table
-- =============================================
CREATE TABLE epoch (
    identifier TEXT PRIMARY KEY,
    start_time TIMESTAMP(3) NOT NULL,
    duration TEXT NOT NULL,
    current_epoch INTEGER,
    current_epoch_start_time TIMESTAMP(3),
    epoch_counting_started BOOLEAN NOT NULL,
    current_epoch_start_height INTEGER
);

CREATE TABLE epoch_event (
    id SERIAL PRIMARY KEY,
    epoch_number INTEGER NOT NULL,
    epoch_identifier TEXT NOT NULL,
    start_height INTEGER NOT NULL,
    end_height INTEGER,
    start_time TIMESTAMP(3) NOT NULL,
    end_time TIMESTAMP(3)
);

ALTER TABLE epoch_event ADD FOREIGN KEY (epoch_identifier) REFERENCES epoch(identifier);

CREATE INDEX idx_epoch_event_epoch_identifier ON epoch_event(epoch_identifier);


-- Down Migration
