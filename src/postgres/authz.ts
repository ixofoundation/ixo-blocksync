import { dbQuery } from "./client";

// Active-only authz grant index (see the authz cases in
// sync_handlers/event_data_sync.ts and the expiry sweep in sync/sync_blocks.ts).

export type AuthzGrantUpsert = {
  granter: string;
  grantee: string;
  msgTypeUrl: string;
  authorizationType?: string;
  authorization?: any; // JSON, "@type"-tagged
  expiration?: Date;
  entityId?: string;
  height: number;
  time: Date;
  txHash?: string;
};

// EventGrant/rich-event: create or overwrite the row. A re-grant of the same
// key overwrites payload and provenance (the chain's SaveGrant is likewise a
// full overwrite). Payload columns always take the new value - within one tx
// the bare EventGrant may upsert first and the richer ixo event overwrites
// with the full payload right after.
const upsertSql = `
INSERT INTO authz_grant (
  granter, grantee, msg_type_url, authorization_type, "authorization",
  expiration, entity_id, granted_at_height, granted_at_time, granted_tx_hash
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (granter, grantee, msg_type_url) DO UPDATE SET
  authorization_type = EXCLUDED.authorization_type,
  "authorization"    = EXCLUDED."authorization",
  expiration         = EXCLUDED.expiration,
  entity_id          = EXCLUDED.entity_id,
  granted_at_height  = EXCLUDED.granted_at_height,
  granted_at_time    = EXCLUDED.granted_at_time,
  granted_tx_hash    = EXCLUDED.granted_tx_hash;
`;

export const upsertAuthzGrant = async (g: AuthzGrantUpsert) => {
  await dbQuery(upsertSql, [
    g.granter,
    g.grantee,
    g.msgTypeUrl,
    g.authorizationType ?? null,
    g.authorization ? JSON.stringify(g.authorization) : null,
    g.expiration ?? null,
    g.entityId ?? null,
    g.height,
    g.time,
    g.txHash ?? null,
  ]);
};

// EventRevoke: the capability is gone (explicit revoke or exhaustion - the
// chain emits the same event for both). Row absence IS the record here; the
// audit trail stays in core's EventCore table.
const deleteSql = `
DELETE FROM authz_grant WHERE granter = $1 AND grantee = $2 AND msg_type_url = $3;
`;

export const deleteAuthzGrant = async (
  granter: string,
  grantee: string,
  msgTypeUrl: string
) => {
  await dbQuery(deleteSql, [granter, grantee, msgTypeUrl]);
};

// Per-block expiry sweep: expiry pruning on-chain is event-silent, so mirror
// it ourselves. Compares against the indexed block's time (NOT wall clock) so
// resyncs/backfills expire grants at the historically correct point. Runs
// inside the per-block transaction; the partial expiration index keeps it a
// no-op-cost scan on blocks with nothing to expire.
const expireSql = `
DELETE FROM authz_grant WHERE expiration IS NOT NULL AND expiration <= $1;
`;

export const deleteExpiredAuthzGrants = async (blockTime: Date): Promise<number> => {
  const res = await dbQuery(expireSql, [blockTime]);
  return res.rowCount ?? 0;
};

// Constraint-consumption refresh (interim until the chain emits
// authorization-update events - IXO-4233): overwrites ONLY the payload
// columns, preserving grant provenance. Returns the affected row count;
// 0 is legitimate (e.g. an admin acting directly without an authz grant).
const refreshSql = `
UPDATE authz_grant SET
  authorization_type = $4,
  "authorization"    = $5,
  expiration         = $6
WHERE granter = $1 AND grantee = $2 AND msg_type_url = $3;
`;

export const refreshAuthzGrantPayload = async (
  granter: string,
  grantee: string,
  msgTypeUrl: string,
  authorizationType: string,
  authorization: any,
  expiration?: Date
): Promise<number> => {
  const res = await dbQuery(refreshSql, [
    granter,
    grantee,
    msgTypeUrl,
    authorizationType,
    JSON.stringify(authorization),
    expiration ?? null,
  ]);
  return res.rowCount ?? 0;
};
