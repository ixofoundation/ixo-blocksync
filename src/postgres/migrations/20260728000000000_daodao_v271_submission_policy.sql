-- Up Migration
-- DAO DAO v2.7.1 support.
--
-- v2.7.1's dao-pre-propose-base replaced the config boolean
-- `open_proposal_submission` with a structured `submission_policy`:
--   { "anyone":   { "denylist": [...] } }                       — open submission
--   { "specific": { "dao_members": bool, "allowlist": [...],
--                   "denylist": [...] } }                        — gated submission
-- We store the policy verbatim in this new JSONB column. The legacy
-- open_proposal_submission boolean column stays populated for old API
-- consumers — for v2.7.1 configs the indexer derives it from the policy
-- (anyone → true, specific → false). NULL means the module was indexed
-- from a legacy (v2.0.3) config that has no structured policy.
ALTER TABLE dao_pre_propose_module ADD COLUMN IF NOT EXISTS submission_policy JSONB;

-- Down Migration
-- ALTER TABLE dao_pre_propose_module DROP COLUMN submission_policy;
