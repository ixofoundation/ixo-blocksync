import { dbQuery, pool } from "./client";

export type AuthzGrantStatus = "active" | "revoked" | "exhausted" | "expired";

export type AuthzGrant = {
  granter: string;
  grantee: string;
  msgTypeUrl: string;
  authorizationType: string;
  authorization: any; // JSON
  expiration?: Date;
  creatingMessageType?: string;
  entityId?: string;
  height: number;
  time: Date;
  txHash?: string;
};

// Upsert to active state. The authorization payload is authoritative (LCD
// hydration at the indexed height), so it always overwrites. Creation
// provenance (granted_at_*, creating_message_type, entity_id) is only reset
// when this block contained an explicit (re-)grant for the key, or when a
// previously closed row is being resurrected — a plain constraint mutation
// (e.g. quota consumption via MsgExec) keeps the original grant provenance.
const upsertActiveSql = `
INSERT INTO authz_grant (
  granter, grantee, msg_type_url, authorization_type, "authorization",
  expiration, status, creating_message_type, entity_id,
  granted_at_height, granted_at_time, granted_tx_hash,
  last_updated_height, last_updated_time, last_updated_tx_hash
)
VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10, $11, $9, $10, $11)
ON CONFLICT (granter, grantee, msg_type_url) DO UPDATE SET
  authorization_type   = EXCLUDED.authorization_type,
  "authorization"      = EXCLUDED."authorization",
  expiration           = EXCLUDED.expiration,
  status               = 'active',
  closed_at_height     = NULL,
  closed_at_time       = NULL,
  last_updated_height  = EXCLUDED.last_updated_height,
  last_updated_time    = EXCLUDED.last_updated_time,
  last_updated_tx_hash = EXCLUDED.last_updated_tx_hash,
  granted_at_height    = CASE WHEN $12 OR authz_grant.status <> 'active'
                              THEN EXCLUDED.granted_at_height ELSE authz_grant.granted_at_height END,
  granted_at_time      = CASE WHEN $12 OR authz_grant.status <> 'active'
                              THEN EXCLUDED.granted_at_time ELSE authz_grant.granted_at_time END,
  granted_tx_hash      = CASE WHEN $12 OR authz_grant.status <> 'active'
                              THEN EXCLUDED.granted_tx_hash ELSE authz_grant.granted_tx_hash END,
  creating_message_type = CASE WHEN $12 OR authz_grant.status <> 'active'
                              THEN EXCLUDED.creating_message_type ELSE authz_grant.creating_message_type END,
  entity_id            = CASE WHEN $12 OR authz_grant.status <> 'active'
                              THEN EXCLUDED.entity_id ELSE authz_grant.entity_id END;
`;

export const upsertActiveAuthzGrant = async (g: AuthzGrant, regrant: boolean) => {
  await dbQuery(upsertActiveSql, [
    g.granter,
    g.grantee,
    g.msgTypeUrl,
    g.authorizationType,
    JSON.stringify(g.authorization),
    g.expiration ?? null,
    g.creatingMessageType ?? null,
    g.entityId ?? null,
    g.height,
    g.time,
    g.txHash ?? null,
    regrant,
  ]);
};

const getActiveKeysSql = `
SELECT msg_type_url, expiration FROM authz_grant
WHERE granter = $1 AND grantee = $2 AND status = 'active';
`;

export const getActiveGrantKeys = async (
  granter: string,
  grantee: string
): Promise<{ msgTypeUrl: string; expiration: Date | null }[]> => {
  const res = await dbQuery(getActiveKeysSql, [granter, grantee]);
  return res.rows.map((r: any) => ({
    msgTypeUrl: r.msg_type_url,
    expiration: r.expiration,
  }));
};

const closeSql = `
UPDATE authz_grant SET
  status = $4,
  closed_at_height = $5,
  closed_at_time = $6,
  last_updated_height = $5,
  last_updated_time = $6,
  last_updated_tx_hash = COALESCE($7, last_updated_tx_hash)
WHERE granter = $1 AND grantee = $2 AND msg_type_url = $3;
`;

export const closeAuthzGrant = async (
  granter: string,
  grantee: string,
  msgTypeUrl: string,
  status: AuthzGrantStatus,
  height: number,
  time: Date,
  txHash?: string
) => {
  await dbQuery(closeSql, [granter, grantee, msgTypeUrl, status, height, time, txHash ?? null]);
};

// Grant that was created and already consumed/revoked within the same block:
// hydration (end-of-block state) never sees it, so record it directly in its
// closed state, with the authorization taken from the message decode.
const insertClosedSql = `
INSERT INTO authz_grant (
  granter, grantee, msg_type_url, authorization_type, "authorization",
  expiration, status, creating_message_type, entity_id,
  granted_at_height, granted_at_time, granted_tx_hash,
  last_updated_height, last_updated_time, last_updated_tx_hash,
  closed_at_height, closed_at_time
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $10, $11, $12, $10, $11)
ON CONFLICT (granter, grantee, msg_type_url) DO UPDATE SET
  authorization_type   = EXCLUDED.authorization_type,
  "authorization"      = EXCLUDED."authorization",
  expiration           = EXCLUDED.expiration,
  status               = EXCLUDED.status,
  creating_message_type = EXCLUDED.creating_message_type,
  entity_id            = EXCLUDED.entity_id,
  granted_at_height    = EXCLUDED.granted_at_height,
  granted_at_time      = EXCLUDED.granted_at_time,
  granted_tx_hash      = EXCLUDED.granted_tx_hash,
  last_updated_height  = EXCLUDED.last_updated_height,
  last_updated_time    = EXCLUDED.last_updated_time,
  last_updated_tx_hash = EXCLUDED.last_updated_tx_hash,
  closed_at_height     = EXCLUDED.closed_at_height,
  closed_at_time       = EXCLUDED.closed_at_time;
`;

export const insertClosedAuthzGrant = async (
  g: AuthzGrant,
  status: AuthzGrantStatus
) => {
  await dbQuery(insertClosedSql, [
    g.granter,
    g.grantee,
    g.msgTypeUrl,
    g.authorizationType,
    JSON.stringify(g.authorization),
    g.expiration ?? null,
    status,
    g.creatingMessageType ?? null,
    g.entityId ?? null,
    g.height,
    g.time,
    g.txHash ?? null,
  ]);
};

// Cron convenience: flip wall-clock-expired active rows so the stored status
// converges without waiting for the pair to be touched again. Query-time
// correctness is already provided by authz_grant_effective_status.
// Runs outside any block transaction, hence pool and not dbQuery.
const expireSql = `
UPDATE authz_grant SET
  status = 'expired',
  closed_at_time = expiration,
  last_updated_time = now()
WHERE status = 'active' AND expiration IS NOT NULL AND expiration <= now();
`;

export const expireAuthzGrants = async (): Promise<number> => {
  const res = await pool.query(expireSql);
  return res.rowCount ?? 0;
};
