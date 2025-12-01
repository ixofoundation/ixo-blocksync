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
};

const createClaimCollectionSql = `
INSERT INTO "public"."ClaimCollection" ( "id", "entity", "admin", "protocol", "startDate", "endDate", "quota", "count", "evaluated", "approved", "rejected", "disputed", "invalidated", "state", "payments", "escrowAccount", "intents")
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17 );
`;
export const createClaimCollection = async (
  p: ClaimCollection
): Promise<void> => {
  await dbQuery(createClaimCollectionSql, [
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
  ]);
};

const updateClaimCollectionSql = `
UPDATE "public"."ClaimCollection" SET
	     "entity" = $1,
	      "admin" = $2,
	   "protocol" = $3,
	  "startDate" = $4,
	    "endDate" = $5,
	      "quota" = $6,
	      "count" = $7,
	  "evaluated" = $8,
	   "approved" = $9,
	   "rejected" = $10,
	   "disputed" = $11,
	"invalidated" = $12,
	      "state" = $13,
	   "payments" = $14,
	"escrowAccount" = $15,
	    "intents" = $16
WHERE
	         "id" = $17;
`;
export const updateClaimCollection = async (
  p: ClaimCollection
): Promise<void> => {
  await dbQuery(updateClaimCollectionSql, [
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
    p.id,
  ]);
};

export type Claim = {
  claimId: string;
  agentDid: string;
  agentAddress: string;
  submissionDate: Date;
  paymentsStatus: any; // JSON
  schemaType?: string;
  collectionId: string;
  evaluation?: Evaluation;
  useIntent?: boolean;
  amount?: any; // JSON
  cw20Payment?: any; // JSON
  cw1155Payment?: any; // JSON
  cw1155IntentPayment?: any; // JSON
};

const createClaimSql = `
INSERT INTO "public"."Claim" ( "claimId", "agentDid", "agentAddress", "submissionDate", "paymentsStatus", "schemaType", "collectionId", "useIntent", "amount", "cw20Payment", "cw1155Payment", "cw1155IntentPayment")
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12 );
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
	"cw1155IntentPayment" = $11
WHERE
	       "claimId" = $12;
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
    p.claimId,
  ]);

  if (p.evaluation) {
    await dbQuery(upsertEvaluationSql, [
      p.evaluation.collectionId,
      p.evaluation.oracle,
      p.evaluation.agentDid,
      p.evaluation.agentAddress,
      p.evaluation.status,
      p.evaluation.reason,
      p.evaluation.verificationProof,
      JSON.stringify(p.evaluation.amount),
      p.evaluation.evaluationDate,
      p.evaluation.claimId,
      p.evaluation.cw20Payment
        ? JSON.stringify(p.evaluation.cw20Payment)
        : null,
      p.evaluation.cw1155Payment
        ? JSON.stringify(p.evaluation.cw1155Payment)
        : null,
      p.evaluation.cw1155IntentPayment
        ? JSON.stringify(p.evaluation.cw1155IntentPayment)
        : null,
    ]);
  }
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

const upsertEvaluationSql = `
INSERT INTO "public"."Evaluation" ( "collectionId", "oracle", "agentDid", "agentAddress", "status", "reason", "verificationProof", "amount", "evaluationDate", "claimId", "cw20Payment", "cw1155Payment", "cw1155IntentPayment")
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 )
ON CONFLICT("claimId") DO UPDATE SET
  "collectionId" = EXCLUDED."collectionId",
  "oracle" = EXCLUDED."oracle",
  "agentDid" = EXCLUDED."agentDid",
  "agentAddress" = EXCLUDED."agentAddress",
  "status" = EXCLUDED."status",
  "reason" = EXCLUDED."reason",
  "verificationProof" = EXCLUDED."verificationProof",
  "amount" = EXCLUDED."amount",
  "evaluationDate" = EXCLUDED."evaluationDate",
  "cw20Payment" = EXCLUDED."cw20Payment",
  "cw1155Payment" = EXCLUDED."cw1155Payment",
  "cw1155IntentPayment" = EXCLUDED."cw1155IntentPayment"
WHERE "Evaluation"."claimId" = EXCLUDED."claimId";
`;

export type Dispute = {
  proof: string;
  subjectId: string;
  type: number;
  data: any; // JSON
};

const createDisputeSql = `
INSERT INTO "public"."Dispute" ( "proof", "subjectId", "type", "data")
VALUES ( $1, $2, $3, $4 );
`;
export const createDispute = async (p: Dispute): Promise<void> => {
  await dbQuery(createDisputeSql, [
    p.proof,
    p.subjectId,
    p.type,
    JSON.stringify(p.data),
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
  collectionId: string
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
  length: number
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
  schemaType: string
): Promise<void> => {
  await pool.query(updateClaimSchemaSql, [claimId, schemaType]);
};

// cant have asc or desc as query parameter, so use direct string interpolation to generate query
const getCollectionClaimsByTypeSql = (orderBy: "asc" | "desc") => `
SELECT c.*,
      CASE WHEN ev."claimId" IS NULL THEN NULL
      ELSE jsonb_build_object(
        'collectionId', ev."collectionId",
        'oracle', ev."oracle",
        'agentDid', ev."agentDid",
        'agentAddress', ev."agentAddress",
        'status', ev."status",
        'reason', ev."reason",
        'verificationProof', ev."verificationProof",
        'amount', ev."amount",
        'evaluationDate', ev."evaluationDate"
      )
      END AS "evaluation"
FROM "Claim" c
LEFT JOIN "Evaluation" AS ev ON c."claimId" = ev."claimId"
WHERE c."collectionId" = $1
  AND (
    ($2::boolean IS NULL) OR /* No type filter */
    ($3::text IS NOT NULL AND c."schemaType" = $3::text) OR /* With non-null type */
    ($3::text IS NULL AND c."schemaType" IS NULL) /* With null type */
  )
  AND (
    ($4::boolean IS NULL) OR /* No status filter */
    (($5::smallint IS NULL OR $5::smallint = 0) AND ev."claimId" IS NULL) OR /* Unevaluated */
    (ev."claimId" IS NOT NULL AND ev."status" = $5::smallint) /* Evaluated with specific status */
  )
  /* pagination below */
  AND (
    $8::text IS NULL OR /* No claimId cursor */
    CASE $6::text
      WHEN 'desc' THEN ( /* Descending order */
        c."submissionDate" < (SELECT c2."submissionDate" FROM "Claim" c2 WHERE c2."claimId" = $8::text) OR
        (c."submissionDate" = (SELECT c2."submissionDate" FROM "Claim" c2 WHERE c2."claimId" = $8::text) AND c."claimId" < $8::text)
      )
      ELSE /* ASC(Ascending order) or Invalid order (default to ASC) */
        (
          c."submissionDate" > (SELECT c2."submissionDate" FROM "Claim" c2 WHERE c2."claimId" = $8::text) OR
          (c."submissionDate" = (SELECT c2."submissionDate" FROM "Claim" c2 WHERE c2."claimId" = $8::text) AND c."claimId" > $8::text)
        )
    END
  )
ORDER BY c."submissionDate" ${orderBy}, c."claimId" ${orderBy}
LIMIT $7
`;
export const getCollectionClaimsByType = async (p: {
  collectionId: string;
  includeType: boolean;
  type: string | null;
  includeStatus: boolean;
  status: number | null;
  orderBy: "asc" | "desc";
  take: number;
  cursor: string | null;
}): Promise<Claim[]> => {
  const res = await pool.query(getCollectionClaimsByTypeSql(p.orderBy), [
    p.collectionId,
    p.includeType || null,
    p.type,
    p.includeStatus || null,
    p.status,
    p.orderBy,
    p.take,
    p.cursor,
  ]);
  return res.rows;
};
