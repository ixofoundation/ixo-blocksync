-- Up Migration

-- Current-state index of x/authz grants: one row per (granter, grantee,
-- msg_type_url), the same natural key the chain's authz keeper uses.
-- Populated by src/sync_handlers/authz_sync.ts, which detects grant-touching
-- messages (MsgGrant/MsgRevoke/MsgExec, ixo entity-account authz msgs,
-- MsgCreateClaimAuthorization) and then hydrates the exact post-block
-- authorization state from the archive LCD at the indexed height. Hydration
-- is what keeps `authorization` accurate: constraints mutate on-chain without
-- any message showing the new state (SendAuthorization spend-limit decrements,
-- ixo claim quota consumption, constraint merging, exhausted-grant deletion).
-- Revokes/exhaustion/expiry soft-flag the row via `status`; a re-grant of the
-- same key resurrects the row as active with fresh provenance.
CREATE TABLE authz_grant (
    granter TEXT NOT NULL,
    grantee TEXT NOT NULL,
    -- msg typeUrl the grant authorizes, e.g. "/cosmos.bank.v1beta1.MsgSend".
    -- Falls back to 'unknown:<@type>' if the authorization type is unmapped.
    msg_type_url TEXT NOT NULL,
    -- @type of the authorization, e.g. "/ixo.claims.v1beta1.SubmitClaimAuthorization"
    authorization_type TEXT NOT NULL,
    -- full decoded authorization, including server-side-mutated constraints
    -- (quoted: AUTHORIZATION is a reserved SQL keyword)
    "authorization" JSONB NOT NULL,
    -- NULL = never expires. Expiry is passive on-chain (pruned without event);
    -- use authz_grant_effective_status for query-time correctness.
    expiration TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active',
    -- typeUrl of the message that created the current grant incarnation
    creating_message_type TEXT,
    -- set when the granter is an ixo entity module account
    entity_id TEXT,
    granted_at_height INTEGER NOT NULL,
    granted_at_time TIMESTAMPTZ NOT NULL,
    granted_tx_hash TEXT,
    last_updated_height INTEGER NOT NULL,
    last_updated_time TIMESTAMPTZ NOT NULL,
    last_updated_tx_hash TEXT,
    closed_at_height INTEGER,
    closed_at_time TIMESTAMPTZ,
    CONSTRAINT authz_grant_pkey PRIMARY KEY (granter, grantee, msg_type_url),
    CONSTRAINT authz_grant_status_chk
      CHECK (status IN ('active', 'revoked', 'exhausted', 'expired'))
);

-- PK covers granter-prefix lookups; add the grantee side and active-only paths.
CREATE INDEX authz_grant_grantee_idx ON authz_grant (grantee);
CREATE INDEX authz_grant_grantee_active_idx ON authz_grant (grantee) WHERE status = 'active';
CREATE INDEX authz_grant_granter_active_idx ON authz_grant (granter) WHERE status = 'active';
CREATE INDEX authz_grant_expiration_active_idx ON authz_grant (expiration)
  WHERE status = 'active' AND expiration IS NOT NULL;
CREATE INDEX authz_grant_entity_idx ON authz_grant (entity_id) WHERE entity_id IS NOT NULL;

-- PostGraphile computed field: resolves passive expiry at query time, since
-- the stored status only flips to 'expired' when the pair is next touched or
-- the expiry cron runs.
CREATE FUNCTION authz_grant_effective_status(g authz_grant) RETURNS TEXT AS $$
  SELECT CASE
    WHEN g.status = 'active' AND g.expiration IS NOT NULL AND g.expiration <= now()
    THEN 'expired'
    ELSE g.status
  END
$$ LANGUAGE sql STABLE;

-- Down Migration
-- DROP FUNCTION authz_grant_effective_status(authz_grant);
-- DROP TABLE authz_grant;
