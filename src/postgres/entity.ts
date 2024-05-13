import { pool } from "./client";
import { Iid } from "./iid";

export type Entity = {
  id: string;
  type: string;
  startDate?: Date;
  endDate?: Date;
  status: number;
  relayerNode: string;
  credentials: string[];
  entityVerified: boolean;
  metadata: any; // JSON
  accounts: any; // JSON
  externalId?: string;
  owner?: string;
};

const createEntitySql = `
INSERT INTO "Entity" ( "id", "type", "startDate", "endDate", "status", "relayerNode", "credentials", "entityVerified", "metadata", "accounts", "externalId", "owner") 
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12 );
`;
export const createEntity = async (p: Entity): Promise<void> => {
  try {
    await pool.query(createEntitySql, [
      p.id,
      p.type,
      p.startDate,
      p.endDate,
      p.status,
      p.relayerNode,
      p.credentials,
      p.entityVerified,
      JSON.stringify(p.metadata),
      JSON.stringify(p.accounts),
      p.externalId,
      p.owner,
    ]);
  } catch (error) {
    throw error;
  }
};

const updateEntitySql = `
UPDATE "public"."Entity" SET
	          "type" = $1,
	     "startDate" = $2,
	       "endDate" = $3,
	        "status" = $4,
	   "relayerNode" = $5,
	   "credentials" = $6,
	"entityVerified" = $7,
	      "metadata" = $8,
	      "accounts" = $9,
	    "externalId" = $10,
	         "owner" = $11
WHERE
	            "id" = $12;
`;
export const updateEntity = async (p: Entity): Promise<void> => {
  try {
    await pool.query(updateEntitySql, [
      p.type,
      p.startDate,
      p.endDate,
      p.status,
      p.relayerNode,
      p.credentials,
      p.entityVerified,
      JSON.stringify(p.metadata),
      JSON.stringify(p.accounts),
      p.externalId,
      p.owner,
      p.id,
    ]);
  } catch (error) {
    throw error;
  }
};

const updateEntityOwnerSql = `
UPDATE "Entity" SET owner = $2 WHERE id = $1;
`;
export const updateEntityOwner = async (e: {
  id: string;
  owner: string;
}): Promise<void> => {
  try {
    await pool.query(updateEntityOwnerSql, [e.id, e.owner]);
  } catch (error) {
    throw error;
  }
};

const updateEntityExternalIdSql = `
UPDATE "Entity" SET "externalId" = $2 WHERE id = $1;
`;
export const updateEntityExternalId = async (e: {
  id: string;
  externalId: string;
}): Promise<void> => {
  try {
    await pool.query(updateEntityExternalIdSql, [e.id, e.externalId]);
  } catch (error) {
    throw error;
  }
};

const getEntityDeviceAndNoExternalIdSql = `
SELECT e."id", i."linkedResource"
FROM "Entity" AS e
INNER JOIN "IID" AS i USING("id")
WHERE e."externalId" IS NULL AND e."type" = 'asset/device'
LIMIT $1;
`;
export const getEntityDeviceAndNoExternalId = async (
  length: number
): Promise<
  {
    id: string;
    linkedResource: any;
  }[]
> => {
  try {
    const res = await pool.query(getEntityDeviceAndNoExternalIdSql, [length]);
    return res.rows;
  } catch (error) {
    throw error;
  }
};

const getEntityServiceSql = `
SELECT i."service"
FROM "IID" AS i
WHERE i.id = $1;
`;
export const getEntityService = async (id: string): Promise<any> => {
  try {
    const res = await pool.query(getEntityServiceSql, [id]);
    return res.rows[0];
  } catch (error) {
    throw error;
  }
};

const getEntityParentIidSql = `
SELECT i."service", i."context", i."linkedResource", i."linkedEntity", i."linkedClaim"
FROM "IID" AS i
WHERE i.id = $1;
`;
export const getEntityParentIid = async (
  id: string
): Promise<
  | {
      service: any;
      context: any;
      linkedResource: any;
      linkedEntity: any;
      linkedClaim: any;
    }
  | undefined
> => {
  try {
    const res = await pool.query(getEntityParentIidSql, [id]);
    return res.rows[0];
  } catch (error) {
    throw error;
  }
};

export type EntityAndIid = Entity & Iid;

const getEntityAndIidSql = `
SELECT
  e.*,
  i."context",
	i."controller",
	i."verificationMethod",
	i."service",
	i."authentication",
	i."assertionMethod",
	i."keyAgreement",
	i."capabilityInvocation",
	i."capabilityDelegation",
	i."linkedResource",
	i."linkedClaim",
	i."accordedRight",
	i."linkedEntity",
	i."alsoKnownAs"
FROM "Entity" AS e
INNER JOIN "IID" AS i USING("id")
WHERE e.id = $1;
`;
export const getEntityAndIid = async (
  id: string
): Promise<EntityAndIid | undefined> => {
  try {
    const res = await pool.query(getEntityAndIidSql, [id]);
    return res.rows[0];
  } catch (error) {
    throw error;
  }
};

const getEntityDeviceAccountsSql = `
SELECT e."id", e."accounts"
FROM "Entity" e
WHERE e."owner" = $1 AND e."type" = 'asset/device';
`;
export const getEntityDeviceAccounts = async (
  owner: string
): Promise<{ id: string; accounts: any }[]> => {
  try {
    const res = await pool.query(getEntityDeviceAccountsSql, [owner]);
    return res.rows;
  } catch (error) {
    throw error;
  }
};

const getEntityAccountsByIidContextSql = `
SELECT e."id", e."accounts"
FROM "Entity" e
INNER JOIN "IID" i ON e."id" = i."id"
WHERE i."context" @> $1;
`;
export const getEntityAccountsByIidContext = async (
  context: any
): Promise<{ id: string; accounts: any }[]> => {
  try {
    const res = await pool.query(getEntityAccountsByIidContextSql, [context]);
    return res.rows;
  } catch (error) {
    throw error;
  }
};
