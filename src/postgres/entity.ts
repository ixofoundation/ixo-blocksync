import { pool, dbQuery } from "./client";

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
  await dbQuery(createEntitySql, [
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
	      "accounts" = $9
WHERE
	            "id" = $10;
`;
export const updateEntity = async (p: Entity): Promise<void> => {
  await dbQuery(updateEntitySql, [
    p.type,
    p.startDate,
    p.endDate,
    p.status,
    p.relayerNode,
    p.credentials,
    p.entityVerified,
    JSON.stringify(p.metadata),
    JSON.stringify(p.accounts),
    p.id,
  ]);
};

const updateEntityOwnerSql = `
UPDATE "Entity" SET owner = $2 WHERE id = $1;
`;
export const updateEntityOwner = async (e: {
  id: string;
  owner: string;
}): Promise<void> => {
  await dbQuery(updateEntityOwnerSql, [e.id, e.owner]);
};

const updateEntityExternalIdSql = `
UPDATE "Entity" SET "externalId" = $2 WHERE id = $1;
`;
export const updateEntityExternalId = async (e: {
  id: string;
  externalId: string;
}): Promise<void> => {
  await dbQuery(updateEntityExternalIdSql, [e.id, e.externalId]);
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
  const res = await pool.query(getEntityDeviceAndNoExternalIdSql, [length]);
  return res.rows;
};

const getEntityServiceSql = `
SELECT i."service"
FROM "IID" AS i
WHERE i.id = $1;
`;
export const getEntityService = async (id: string): Promise<any> => {
  const res = await pool.query(getEntityServiceSql, [id]);
  return res.rows[0];
};

const getEntityAccountsSql = `
SELECT "accounts" FROM "Entity" WHERE "id" = $1;
`;
// Resolves an entity module account address by account name. Uses dbQuery so
// it sees Entity rows written earlier in the same per-block transaction
// (an entity can be created and granted authz within the same block).
export const getEntityAccountAddress = async (
  id: string,
  name: string
): Promise<string | undefined> => {
  const res = await dbQuery(getEntityAccountsSql, [id]);
  const accounts = res.rows[0]?.accounts;
  if (!Array.isArray(accounts)) return undefined;
  return accounts.find((a: any) => a?.name === name)?.address;
};
