-- Up Migration

-- The OpenHands oracle's grants feed (Linear IXO-5750, oracle speed plan D6)
-- polls once a minute per oracle:
--   authzGrants(first: 50, orderBy: GRANTED_AT_HEIGHT_ASC,
--     condition: { grantee, msgTypeUrl: "/ixo.claims.v1beta1.MsgCreateClaimAuthorization" },
--     filter: { grantedAtHeight: { greaterThanOrEqualTo: <cursor> } })
-- which compiles to grantee = $1 and msg_type_url = $2 and granted_at_height >= $3
-- order by granted_at_height. With only authz_grant_grantee_idx, Postgres reads
-- every grant to that oracle (11k on mainnet today, 1M at OpenHands scale) and
-- sorts them each tick. This index makes it a short range scan: measured on
-- mainnet 2026-10-23, 34.9 ms (filter + top-N sort) -> 0.4 ms. The reported
-- 2–3 s per call was not server-side: the API request log shows p50 16 ms,
-- max 224 ms for authzGrants over 36 h.
--
-- Same operational rule as the other index migrations: built by hand first with
-- CREATE INDEX CONCURRENTLY on devnet, testnet and mainnet (indisvalid = true),
-- so this statement is a no-op at indexer startup.
CREATE INDEX IF NOT EXISTS authz_grant_grantee_type_height_idx
  ON authz_grant (grantee, msg_type_url, granted_at_height);

-- Down Migration

DROP INDEX IF EXISTS authz_grant_grantee_type_height_idx;
