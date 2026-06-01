-- Up Migration
--
-- Backward-compat alias: restore the pre-v7 `Claim.evaluationByClaimId`
-- (singular) GraphQL field, ALONGSIDE the existing `Claim.evaluation`.
--
-- Pre-v7, `Evaluation.claimId` was the PRIMARY KEY (one evaluation per
-- claim), so PostGraphile auto-generated a *singular* backward relation
-- `Claim.evaluationByClaimId`. The v7 migration re-modelled Evaluation as
-- 1:N history (surrogate `id` PK, non-unique `claimId`), which turned that
-- backward relation into the *plural* connection `Claim.evaluationsByClaimId`
-- and removed the singular `evaluationByClaimId` field. Existing clients
-- querying `evaluationByClaimId` started getting
--   "Cannot query field evaluationByClaimId on type Claim".
--
-- The v7 work exposes the current evaluation as `Claim.evaluation` (via the
-- `currentEvaluationId` forward FK + smart-tag rename in
-- src/graphql/smart_tags_plugin.ts). A smart tag can only name that one
-- relation once, so we keep `evaluation` as-is and add the old name back as
-- a separate PostGraphile computed column. A function named
-- `<Table>_<field>` taking a row of that table as its first arg is exposed
-- by PostGraphile as a computed column `Claim.evaluationByClaimId` returning
-- the Evaluation GraphQL type.
--
-- Both names resolve to the same row — the current/latest evaluation pointed
-- at by `Claim.currentEvaluationId` — so they are interchangeable and return
-- identical data. NULL when the claim is unevaluated (currentEvaluationId IS
-- NULL), matching the old 1:1 behaviour. The lookup is a primary-key hit on
-- Evaluation(id); PostGraphile inlines the computed column into the parent
-- query so list selections stay single-round-trip.
CREATE FUNCTION "Claim_evaluationByClaimId"(rec "Claim")
RETURNS "Evaluation" AS $$
  SELECT e.*
  FROM "Evaluation" e
  WHERE e."id" = rec."currentEvaluationId";
$$ LANGUAGE sql STABLE;

-- Down Migration
DROP FUNCTION IF EXISTS "Claim_evaluationByClaimId"("Claim");
