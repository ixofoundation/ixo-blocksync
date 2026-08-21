-- Up Migration

-- ACTIVE-ONLY index of x/authz grants, driven by the chain's typed events
-- (cosmos.authz.v1beta1.EventGrant/EventRevoke + the richer
-- ixo.entity.v1beta1.EntityAccountAuthz*Event), which the SDK emits at KEEPER
-- level - so every grant path is covered: MsgGrant/MsgRevoke, MsgExec
-- exhaustion-deletion, ixo entity-account authz (granter = resolved entity
-- module account, with full authorization + constraints + expiration in the
-- event), claims module auto-grants, and wasm/ICA/gov-dispatched grants.
--
-- Row present = capability currently exists; revocation/exhaustion DELETES
-- the row (same EventRevoke on-chain), and the per-block expiry sweep in
-- sync_blocks deletes rows whose expiration <= the indexed block's time (block
-- time, not wall clock, so historical resyncs expire correctly). The full
-- audit trail (who granted/revoked what, when) lives in blocksync-core's
-- EventCore/MessageCore tables - this table is deliberately just the live
-- capability view, latest constraint state only (the chain emits nothing on
-- constraint consumption, so no accurate history is possible anyway).
CREATE TABLE authz_grant (
    granter TEXT NOT NULL,
    grantee TEXT NOT NULL,
    -- msg typeUrl the grant authorizes, e.g. "/cosmos.bank.v1beta1.MsgSend"
    msg_type_url TEXT NOT NULL,
    -- @type of the authorization, e.g. "/ixo.claims.v1beta1.SubmitClaimAuthorization";
    -- NULL when the payload could not be resolved from message or LCD
    authorization_type TEXT,
    -- decoded authorization incl. constraints, "@type"-tagged (quoted:
    -- AUTHORIZATION is a reserved SQL keyword); NULL when unresolvable
    "authorization" JSONB,
    -- NULL = never expires
    expiration TIMESTAMPTZ,
    -- set when the granter is an ixo entity module account
    entity_id TEXT,
    granted_at_height INTEGER NOT NULL,
    granted_at_time TIMESTAMPTZ NOT NULL,
    granted_tx_hash TEXT,
    CONSTRAINT authz_grant_pkey PRIMARY KEY (granter, grantee, msg_type_url)
);

-- PK covers granter-prefix lookups; add the grantee side, entity lookups and
-- the expiry-sweep path.
CREATE INDEX authz_grant_grantee_idx ON authz_grant (grantee);
CREATE INDEX authz_grant_entity_idx ON authz_grant (entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX authz_grant_expiration_idx ON authz_grant (expiration) WHERE expiration IS NOT NULL;

-- Down Migration

DROP TABLE authz_grant;
