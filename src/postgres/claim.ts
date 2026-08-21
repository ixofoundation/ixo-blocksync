import { dbQuery, pool } from "./client";

export type ClaimCollection = {
  id: string;
  entity: string;
  admin: string;
  protocol: string;
  startDate?: Date;
  endDate?: Date;
  quota: number;
  count: number;
  evaluated: number;
  approved: number;
  rejected: number;
  disputed: number;
  invalidated: number;
  state: number;
  payments: any; // JSON
  escrowAccount?: string;
  intents?: number;
  // v7 additions
  flagged?: number;
  flaggedActive?: number;
  serviceAgentDepositRequired?: any; // JSON Coins
  evaluatorDepositRequired?: any; // JSON Coins
  disputeDepositAmount?: any; // JSON Coins
  penaltyAmountPerDispute?: any; // JSON Coins
  disputesOpen?: number;
  disputesAwarded?: number;
  disputesDismissed?: number;
  minDepositPeriodNs?: string; // Duration as nanoseconds (BIGINT-safe as string)
  adjudicators?: any; // JSON [{did, reward_percentage}]
};

// Upsert is the cleanest fit for collection events because the v7 chain re-emits
// the full Collection state on every counter change (flagged++, disputes_open++, ...)
// and CollectionCreatedEvent fires only once at creation.
const upsertClaimCollectionSql = `
INSERT INTO "public"."ClaimCollection" (
  "id", "entity", "admin", "protocol", "startDate", "endDate",
  "quota", "count", "evaluated", "approved", "rejected", "disputed",
  "invalidated", "state", "payments", "escrowAccount", "intents",
  "flagged", "flaggedActive",
  "serviceAgentDepositRequired", "evaluatorDepositRequired",
  "disputeDepositAmount", "penaltyAmountPerDispute",
  "disputesOpen", "disputesAwarded", "disputesDismissed",
  "minDepositPeriodNs", "adjudicators"
)
VALUES (
  $1, $2, $3, $4, $5, $6,
  $7, $8, $9, $10, $11, $12,
  $13, $14, $15, $16, $17,
  $18, $19,
  $20, $21,
  $22, $23,
  $24, $25, $26,
  $27, $28
)
ON CONFLICT ("id") DO UPDATE SET
  "entity" = EXCLUDED."entity",
  "admin" = EXCLUDED."admin",
  "protocol" = EXCLUDED."protocol",
  "startDate" = EXCLUDED."startDate",
  "endDate" = EXCLUDED."endDate",
  "quota" = EXCLUDED."quota",
  "count" = EXCLUDED."count",
  "evaluated" = EXCLUDED."evaluated",
  "approved" = EXCLUDED."approved",
  "rejected" = EXCLUDED."rejected",
  "disputed" = EXCLUDED."disputed",
  "invalidated" = EXCLUDED."invalidated",
  "state" = EXCLUDED."state",
  "payments" = EXCLUDED."payments",
  "escrowAccount" = EXCLUDED."escrowAccount",
  "intents" = EXCLUDED."intents",
  "flagged" = EXCLUDED."flagged",
  "flaggedActive" = EXCLUDED."flaggedActive",
  "serviceAgentDepositRequired" = EXCLUDED."serviceAgentDepositRequired",
  "evaluatorDepositRequired" = EXCLUDED."evaluatorDepositRequired",
  "disputeDepositAmount" = EXCLUDED."disputeDepositAmount",
  "penaltyAmountPerDispute" = EXCLUDED."penaltyAmountPerDispute",
  "disputesOpen" = EXCLUDED."disputesOpen",
  "disputesAwarded" = EXCLUDED."disputesAwarded",
  "disputesDismissed" = EXCLUDED."disputesDismissed",
  "minDepositPeriodNs" = EXCLUDED."minDepositPeriodNs",
  "adjudicators" = EXCLUDED."adjudicators";
`;
const upsertClaimCollectionParams = (p: ClaimCollection) => [
  p.id,
  p.entity,
  p.admin,
  p.protocol,
  p.startDate,
  p.endDate,
  p.quota,
  p.count,
  p.evaluated,
  p.approved,
  p.rejected,
  p.disputed,
  p.invalidated,
  p.state,
  JSON.stringify(p.payments),
  p.escrowAccount,
  p.intents,
  p.flagged ?? 0,
  p.flaggedActive ?? 0,
  p.serviceAgentDepositRequired
    ? JSON.stringify(p.serviceAgentDepositRequired)
    : null,
  p.evaluatorDepositRequired
    ? JSON.stringify(p.evaluatorDepositRequired)
    : null,
  p.disputeDepositAmount ? JSON.stringify(p.disputeDepositAmount) : null,
  p.penaltyAmountPerDispute ? JSON.stringify(p.penaltyAmountPerDispute) : null,
  p.disputesOpen ?? 0,
  p.disputesAwarded ?? 0,
  p.disputesDismissed ?? 0,
  p.minDepositPeriodNs ?? "0",
  p.adjudicators ? JSON.stringify(p.adjudicators) : null,
];

export const createClaimCollection = async (
  p: ClaimCollection,
): Promise<void> => {
  await dbQuery(upsertClaimCollectionSql, upsertClaimCollectionParams(p));
};

export const updateClaimCollection = async (
  p: ClaimCollection,
): Promise<void> => {
  await dbQuery(upsertClaimCollectionSql, upsertClaimCollectionParams(p));
};

const getCollectionAdminSql = `
SELECT "admin" FROM "public"."ClaimCollection" WHERE "id" = $1;
`;
// Uses dbQuery so it sees a ClaimCollection created earlier in this same
// per-block transaction (authz constraint refresh resolves the granter).
export const getCollectionAdmin = async (
  id: string
): Promise<string | undefined> => {
  const res = await dbQuery(getCollectionAdminSql, [id]);
  return res.rows[0]?.admin;
};

export type Claim = {
  claimId: string;
  agentDid: string;
  agentAddress: string;
  submissionDate: Date;
  paymentsStatus: any; // JSON
  schemaType?: string;
  collectionId: string;
  useIntent?: boolean;
  amount?: any; // JSON
  cw20Payment?: any; // JSON
  cw1155Payment?: any; // JSON
  cw1155IntentPayment?: any; // JSON
  // v7 additions. Evaluation rows are written separately via
  // insertEvaluation / insertEvaluationHistory — they live in the Evaluation
  // table now, append-only, instead of a JSONB column on Claim.
  memberAddress?: string;
};

const createClaimSql = `
INSERT INTO "public"."Claim" ( "claimId", "agentDid", "agentAddress", "submissionDate", "paymentsStatus", "schemaType", "collectionId", "useIntent", "amount", "cw20Payment", "cw1155Payment", "cw1155IntentPayment", "memberAddress")
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 );
`;
export const createClaim = async (p: Claim): Promise<void> => {
  await dbQuery(createClaimSql, [
    p.claimId,
    p.agentDid,
    p.agentAddress,
    p.submissionDate,
    JSON.stringify(p.paymentsStatus),
    p.schemaType,
    p.collectionId,
    p.useIntent,
    p.amount ? JSON.stringify(p.amount) : null,
    p.cw20Payment ? JSON.stringify(p.cw20Payment) : null,
    p.cw1155Payment ? JSON.stringify(p.cw1155Payment) : null,
    p.cw1155IntentPayment ? JSON.stringify(p.cw1155IntentPayment) : null,
    p.memberAddress || null,
  ]);
};

const updateClaimSql = `
UPDATE "public"."Claim" SET
	      "agentDid" = $1,
	  "agentAddress" = $2,
	"submissionDate" = $3,
	"paymentsStatus" = $4,
	    "schemaType" = $5,
	  "collectionId" = $6,
	    "useIntent" = $7,
	       "amount" = $8,
	   "cw20Payment" = $9,
	 "cw1155Payment" = $10,
	"cw1155IntentPayment" = $11,
	 "memberAddress" = $12
WHERE
	       "claimId" = $13;
`;
export const updateClaim = async (p: Claim): Promise<void> => {
  await dbQuery(updateClaimSql, [
    p.agentDid,
    p.agentAddress,
    p.submissionDate,
    JSON.stringify(p.paymentsStatus),
    p.schemaType,
    p.collectionId,
    p.useIntent,
    p.amount ? JSON.stringify(p.amount) : null,
    p.cw20Payment ? JSON.stringify(p.cw20Payment) : null,
    p.cw1155Payment ? JSON.stringify(p.cw1155Payment) : null,
    p.cw1155IntentPayment ? JSON.stringify(p.cw1155IntentPayment) : null,
    p.memberAddress || null,
    p.claimId,
  ]);
};

export type Evaluation = {
  collectionId: string;
  oracle: string;
  agentDid: string;
  agentAddress: string;
  status: number;
  reason: number;
  verificationProof?: string;
  amount: any; // JSON
  evaluationDate: Date;
  claimId: string;
  cw20Payment?: any; // JSON
  cw1155Payment?: any; // JSON
  cw1155IntentPayment?: any; // JSON
};

// v7: Evaluation is now append-only. Each row is one evaluation in a claim's
// history. Unique on (claimId, agentAddress, evaluationDate) so re-indexing
// or re-emission of the same event is idempotent. "Current" evaluation =
// the row pointed at by Claim.currentEvaluationId (kept in sync via
// setClaimCurrentEvaluation below), so Postgraphile still exposes a
// singular Claim.evaluation field for backward compatibility.
//
// `ON CONFLICT … DO UPDATE SET "claimId" = EXCLUDED."claimId"` is a no-op
// (assigns the same value) but it forces the conflict path to RETURN the
// existing row's id — straight `DO NOTHING` returns no rows on conflict.
const insertEvaluationSql = `
INSERT INTO "public"."Evaluation" (
  "collectionId", "oracle", "agentDid", "agentAddress",
  "status", "reason", "verificationProof", "amount", "evaluationDate",
  "claimId", "cw20Payment", "cw1155Payment", "cw1155IntentPayment"
)
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 )
ON CONFLICT ("claimId", "agentAddress", "evaluationDate") DO UPDATE
  SET "claimId" = EXCLUDED."claimId"
RETURNING "id";
`;

export const insertEvaluation = async (e: Evaluation): Promise<number> => {
  const res = await dbQuery(insertEvaluationSql, [
    e.collectionId,
    e.oracle,
    e.agentDid,
    e.agentAddress,
    e.status,
    e.reason,
    e.verificationProof,
    JSON.stringify(e.amount ?? []),
    e.evaluationDate,
    e.claimId,
    e.cw20Payment ? JSON.stringify(e.cw20Payment) : null,
    e.cw1155Payment ? JSON.stringify(e.cw1155Payment) : null,
    e.cw1155IntentPayment ? JSON.stringify(e.cw1155IntentPayment) : null,
  ]);
  return Number(res.rows[0]?.id);
};

// Bulk-insert evaluation history entries (idempotent on conflict). We
// discard the returned ids — only the current evaluation needs to point
// back from Claim.currentEvaluationId.
export const insertEvaluationHistory = async (
  entries: Evaluation[]
): Promise<void> => {
  for (const e of entries) {
    await insertEvaluation(e);
  }
};

// Point Claim.currentEvaluationId at the freshly-inserted current
// evaluation. Called from the ClaimUpdatedEvent handler after the current
// evaluation has been inserted and its id returned.
const setClaimCurrentEvaluationSql = `
UPDATE "public"."Claim"
SET "currentEvaluationId" = $2
WHERE "claimId" = $1;
`;
export const setClaimCurrentEvaluation = async (
  claimId: string,
  evaluationId: number
): Promise<void> => {
  await dbQuery(setClaimCurrentEvaluationSql, [claimId, evaluationId]);
};

export type Dispute = {
  // v7 dispute fields; `proof` is kept for backward-compat but is now nullable —
  // structured DisputeData lives in `data`.
  proof?: string;
  subjectId: string;
  type: number;
  data: any; // JSON DisputeData (uri, type, proof, encrypted)
  targetRole: number;
  disputerAddress: string;
  disputerDid: string;
  disputeDeposit?: any; // JSON Coins
  submittedAt: Date;
  status: number;
};

// Insert a fresh OPEN dispute. Adjudication state (status flip + resolution
// row) is handled separately by resolveDispute, called from the
// DisputeResolvedEvent handler.
// Re-indexing the same dispute (e.g. on indexer restart that re-replays
// a block already processed) must not conflict on the partial unique
// index "Dispute_open_per_subject_target_uniq" — it's keyed on the
// natural-key triple (subjectId, targetRole) WHERE status=0. We target
// that index explicitly so duplicate inserts are a no-op.
const insertDisputeSql = `
INSERT INTO "public"."Dispute" (
  "proof", "subjectId", "type", "data",
  "targetRole", "disputerAddress", "disputerDid", "disputeDeposit",
  "submittedAt", "status"
)
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10 )
ON CONFLICT ("subjectId", "targetRole") WHERE "status" = 0 DO NOTHING;
`;
export const createDispute = async (p: Dispute): Promise<void> => {
  await dbQuery(insertDisputeSql, [
    p.proof ?? p.data?.proof ?? null,
    p.subjectId,
    p.type,
    JSON.stringify(p.data),
    p.targetRole ?? 0,
    p.disputerAddress,
    p.disputerDid,
    p.disputeDeposit ? JSON.stringify(p.disputeDeposit) : null,
    p.submittedAt,
    p.status ?? 0,
  ]);
};

export type DisputeResolution = {
  adjudicatorDid: string;
  adjudicatorAddress: string;
  adjudicatorPayoutAddress: string;
  resolvedAt: Date;
  data?: any; // JSON DisputeData (nullable — adjudicator may resolve without docs)
  intendedPenalty?: any; // JSON Coins
  actualPenaltyPaid?: any; // JSON Coins
  winnerAmount?: any; // JSON Coins
  adjudicatorAmount?: any; // JSON Coins
  winnerAddress: string;
  loserAddress: string;
};

// Resolve the open dispute for a given (subjectId, targetRole) and write its
// DisputeResolution row. Both happen in a single CTE so the status flip and
// the resolution insert are atomic — clients can't observe a status=RESOLVED
// dispute without an attached resolution row.
//
// Idempotency: on a re-index, the second call finds no OPEN dispute (subquery
// returns no row), the UPDATE no-ops, the CTE produces zero rows, the INSERT
// inserts nothing. The DisputeResolution.disputeId PK + ON CONFLICT DO
// NOTHING also defends against the same disputeId being written twice if a
// future re-emission ever hits a still-OPEN dispute.
const resolveDisputeSql = `
WITH resolved AS (
  UPDATE "public"."Dispute" SET
    "status" = $1,
    "data" = $2
  WHERE "id" = (
    SELECT "id" FROM "public"."Dispute"
    WHERE "subjectId" = $3 AND "targetRole" = $4 AND "status" = 0
    ORDER BY "submittedAt" DESC
    LIMIT 1
  )
  RETURNING "id"
)
INSERT INTO "public"."DisputeResolution" (
  "disputeId",
  "adjudicatorDid", "adjudicatorAddress", "adjudicatorPayoutAddress",
  "resolvedAt", "data",
  "intendedPenalty", "actualPenaltyPaid",
  "winnerAmount", "adjudicatorAmount",
  "winnerAddress", "loserAddress"
)
SELECT
  resolved.id,
  $5, $6, $7,
  $8, $9,
  $10, $11,
  $12, $13,
  $14, $15
FROM resolved
ON CONFLICT ("disputeId") DO NOTHING;
`;

export const resolveDispute = async (p: {
  subjectId: string;
  targetRole: number;
  status: number;
  resolution: DisputeResolution;
  data?: any;
}): Promise<void> => {
  const r = p.resolution;
  await dbQuery(resolveDisputeSql, [
    p.status,
    JSON.stringify(p.data ?? {}),
    p.subjectId,
    p.targetRole,
    r.adjudicatorDid,
    r.adjudicatorAddress,
    r.adjudicatorPayoutAddress,
    r.resolvedAt,
    r.data ? JSON.stringify(r.data) : null,
    JSON.stringify(r.intendedPenalty ?? []),
    JSON.stringify(r.actualPenaltyPaid ?? []),
    JSON.stringify(r.winnerAmount ?? []),
    JSON.stringify(r.adjudicatorAmount ?? []),
    r.winnerAddress,
    r.loserAddress,
  ]);
};

const getCollectionsClaimTypeNullSql = `
SELECT cc.id
FROM "ClaimCollection" AS cc
INNER JOIN "Claim" AS c ON cc."id" = c."collectionId"
WHERE c."schemaType" IS NULL
GROUP BY cc.id;
`;
export const getCollectionsClaimTypeNull = async (): Promise<
  { id: string }[]
> => {
  const res = await pool.query(getCollectionsClaimTypeNullSql);
  return res.rows;
};

const getCollectionEntitySql = `
SELECT cc."entity"
FROM "ClaimCollection" AS cc
WHERE cc.id = $1;
`;
export const getCollectionEntity = async (
  collectionId: string,
): Promise<
  | {
      entity: string;
    }
  | undefined
> => {
  const res = await pool.query(getCollectionEntitySql, [collectionId]);
  return res.rows[0];
};

const getCollectionClaimsTypeNullSql = `
SELECT c."claimId"
FROM "ClaimCollection" AS cc
INNER JOIN "Claim" AS c ON cc."id" = c."collectionId"
WHERE cc.id = $1 AND c."schemaType" IS NULL
LIMIT $2;
`;
export const getCollectionClaimsTypeNull = async (
  collectionId: string,
  length: number,
): Promise<
  {
    claimId: string;
  }[]
> => {
  const res = await pool.query(getCollectionClaimsTypeNullSql, [
    collectionId,
    length,
  ]);
  return res.rows;
};

const updateClaimSchemaSql = `
UPDATE "public"."Claim" SET "schemaType" = $2
WHERE "claimId" = $1;
`;
export const updateClaimSchema = async (
  claimId: string,
  schemaType: string,
): Promise<void> => {
  await pool.query(updateClaimSchemaSql, [claimId, schemaType]);
};

// ==========================================================================
// v7: MEMBER BUDGETS (team-member subscription pools )
// ==========================================================================

export type MemberBudget = {
  collectionId: string;
  memberAddress: string;
  // Duration stored as nanoseconds — string to preserve full uint64 precision
  periodNs: string;
  periodSpendLimit: any; // JSON Coins
  periodSpent: any; // JSON Coins
  periodCw20SpendLimit?: any; // JSON CW20Payment[]
  periodCw20Spent?: any; // JSON CW20Payment[]
  periodResetAt: Date;
  updatedAtHeight?: number;
  updatedAt?: Date;
};

// The proto re-emits the full MemberBudget state on every event (Created /
// Updated covers all admin edits, period-spent deductions, restorations and
// lazy resets), so an upsert is the right shape — there is no partial update.
const upsertMemberBudgetSql = `
INSERT INTO "public"."MemberBudget" (
  "collectionId", "memberAddress", "periodNs",
  "periodSpendLimit", "periodSpent",
  "periodCw20SpendLimit", "periodCw20Spent",
  "periodResetAt", "updatedAtHeight", "updatedAt"
)
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10 )
ON CONFLICT ("collectionId", "memberAddress") DO UPDATE SET
  "periodNs" = EXCLUDED."periodNs",
  "periodSpendLimit" = EXCLUDED."periodSpendLimit",
  "periodSpent" = EXCLUDED."periodSpent",
  "periodCw20SpendLimit" = EXCLUDED."periodCw20SpendLimit",
  "periodCw20Spent" = EXCLUDED."periodCw20Spent",
  "periodResetAt" = EXCLUDED."periodResetAt",
  "updatedAtHeight" = EXCLUDED."updatedAtHeight",
  "updatedAt" = EXCLUDED."updatedAt";
`;

export const upsertMemberBudget = async (p: MemberBudget): Promise<void> => {
  await dbQuery(upsertMemberBudgetSql, [
    p.collectionId,
    p.memberAddress,
    p.periodNs,
    JSON.stringify(p.periodSpendLimit ?? []),
    JSON.stringify(p.periodSpent ?? []),
    p.periodCw20SpendLimit ? JSON.stringify(p.periodCw20SpendLimit) : null,
    p.periodCw20Spent ? JSON.stringify(p.periodCw20Spent) : null,
    p.periodResetAt,
    p.updatedAtHeight ?? null,
    p.updatedAt ?? null,
  ]);
};

const deleteMemberBudgetSql = `
DELETE FROM "public"."MemberBudget"
WHERE "collectionId" = $1 AND "memberAddress" = $2;
`;
export const deleteMemberBudget = async (
  collectionId: string,
  memberAddress: string,
): Promise<void> => {
  await dbQuery(deleteMemberBudgetSql, [collectionId, memberAddress]);
};

// ==========================================================================
// v7: AGENT PERFORMANCE DEPOSIT BALANCES
// ==========================================================================

export type AgentDepositBalance = {
  collectionId: string;
  agentAddress: string;
  amount: any; // JSON Coins
  withdrawableAt: Date;
  updatedAtHeight?: number;
  updatedAt?: Date;
};

const upsertAgentDepositBalanceSql = `
INSERT INTO "public"."AgentDepositBalance" (
  "collectionId", "agentAddress", "amount", "withdrawableAt",
  "updatedAtHeight", "updatedAt"
)
VALUES ( $1, $2, $3, $4, $5, $6 )
ON CONFLICT ("collectionId", "agentAddress") DO UPDATE SET
  "amount" = EXCLUDED."amount",
  "withdrawableAt" = EXCLUDED."withdrawableAt",
  "updatedAtHeight" = EXCLUDED."updatedAtHeight",
  "updatedAt" = EXCLUDED."updatedAt";
`;

export const upsertAgentDepositBalance = async (
  p: AgentDepositBalance,
): Promise<void> => {
  await dbQuery(upsertAgentDepositBalanceSql, [
    p.collectionId,
    p.agentAddress,
    JSON.stringify(p.amount ?? []),
    p.withdrawableAt,
    p.updatedAtHeight ?? null,
    p.updatedAt ?? null,
  ]);
};

const deleteAgentDepositBalanceSql = `
DELETE FROM "public"."AgentDepositBalance"
WHERE "collectionId" = $1 AND "agentAddress" = $2;
`;
export const deleteAgentDepositBalance = async (
  collectionId: string,
  agentAddress: string,
): Promise<void> => {
  await dbQuery(deleteAgentDepositBalanceSql, [collectionId, agentAddress]);
};

// =============================================
// V7 snapshot helpers
// =============================================

// Stamp every legacy Dispute (target_role=0 UNSPECIFIED) as DISMISSED.
// Mirrors the silent KV rewrite the v7 claims store migration performs.
// We can't filter on chain-side dispute id because our schema dropped the
// pre-v7 PK; we rely on (status=OPEN AND targetRole=0) as the legacy
// signature — matches exactly what the chain's iter+filter would produce.
//
// Returns the number of rows actually flipped.
export const dismissLegacyDisputes = async (): Promise<number> => {
  const r = await dbQuery(
    // status 0 = OPEN, 1 = AWARDED, 2 = DISMISSED (matches
    // DISPUTE_STATUS_MAP in event_data_sync.ts)
    `UPDATE "Dispute" SET "status" = 2
       WHERE "status" = 0 AND "targetRole" = 0
     RETURNING id;`,
    []
  );
  return r.rowCount ?? 0;
};

// Return the list of collectionIds the indexer already knows about — the
// v7 snapshot iterates these to refresh new-in-v7 columns from chain.
export const listAllCollectionIds = async (): Promise<string[]> => {
  const r = await dbQuery(`SELECT "id" FROM "ClaimCollection";`);
  return r.rows.map((row: any) => row.id);
};
