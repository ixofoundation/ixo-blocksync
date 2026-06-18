import {
  EntityChainRow,
  getEntityDeviceAndNoExternalId,
  getEntityInheritanceChains,
  getIidsByIds,
  IidPassthrough,
  updateEntityExternalId,
} from "../postgres/entity";
import { chunkArray } from "../util/helpers";
import { IPFS_SERVICE_MAPPING } from "../util/secrets";
import { getIpfsDocument } from "./ipfs_handler";

// --------------------------------------------------------------------------------
// Batched entity-field loaders (DataLoader batch functions)
//
// These power the custom Entity DID fields exposed by src/graphql/entity.ts.
// Both take the full set of entity ids selected in a single GraphQL request and
// resolve them in ONE database round-trip, instead of the previous per-entity
// query + sequential parent-chain walk (which was O(entities x chain-depth)
// single-row queries and timed out on large lists).
//
// Each returns an array aligned 1:1 with the input ids (DataLoader contract).
// --------------------------------------------------------------------------------

// Serves the 12 passthrough DID fields (context, controller, verificationMethod,
// authentication, assertionMethod, keyAgreement, capabilityInvocation,
// capabilityDelegation, linkedClaim, accordedRight, linkedEntity, alsoKnownAs) —
// returned verbatim from each entity's own IID row, no inheritance.
export const loadIidPassthrough = async (
  ids: readonly string[]
): Promise<(IidPassthrough | null)[]> => {
  const rows = await getIidsByIds(ids as string[]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  // align to input order; null is a can't-happen (every Entity has an IID)
  return ids.map((id) => byId.get(id) ?? null);
};

export type ResolvedEntity = {
  service: any[];
  linkedResource: any[];
  settings: Record<string, any>;
};

// Serves the 3 inheritance-resolved fields: service, linkedResource, settings.
// Fetches every requested entity's full class chain in one recursive query, then
// merges service + linkedResource child-first (entity's own entries win, parents
// only fill in ids not already present), splits Settings resources out of
// linkedResource, and applies the IPFS endpoint mapping — mirroring the previous
// getFullEntityById logic exactly, but for the whole batch at once.
export const loadResolvedEntities = async (
  ids: readonly string[]
): Promise<ResolvedEntity[]> => {
  const rows = await getEntityInheritanceChains(ids as string[]);

  // group chain rows by root entity; SQL already orders by (root_id, depth),
  // so each group is ordered child-first.
  const byRoot = new Map<string, EntityChainRow[]>();
  for (const row of rows) {
    const list = byRoot.get(row.rootId);
    if (list) list.push(row);
    else byRoot.set(row.rootId, [row]);
  }

  return ids.map((id) => {
    const chain = byRoot.get(id);
    if (!chain) return { service: [], linkedResource: [], settings: {} };

    // merge across the chain, child-first, dedup by id
    const service: any[] = [];
    const serviceIds = new Set<string>();
    const linkedResource: any[] = [];
    const linkedResourceIds = new Set<string>();
    for (const node of chain) {
      for (const s of node.service ?? []) {
        if (!serviceIds.has(s.id)) {
          serviceIds.add(s.id);
          service.push(s);
        }
      }
      for (const r of node.linkedResource ?? []) {
        if (!linkedResourceIds.has(r.id)) {
          linkedResourceIds.add(r.id);
          linkedResource.push(r);
        }
      }
    }

    // split Settings resources out of linkedResource (child wins, as child
    // entries come first in the merged array)
    const settings: Record<string, any> = {};
    const nonSettingsResources: any[] = [];
    for (const resource of linkedResource) {
      if (resource.type === "Settings") {
        if (!settings[resource.description]) {
          settings[resource.description] = resource;
        }
      } else {
        nonSettingsResources.push(resource);
      }
    }

    // custom IPFS endpoint mapping (unchanged behaviour)
    const finalService = IPFS_SERVICE_MAPPING
      ? service.map((s) =>
          s.id?.includes("ipfs")
            ? { ...s, serviceEndpoint: IPFS_SERVICE_MAPPING }
            : s
        )
      : service;

    return {
      service: finalService,
      linkedResource: nonSettingsResources,
      settings,
    };
  });
};

export const deviceExternalIdsLoaded = async () => {
  const entity = await getEntityDeviceAndNoExternalId(1);
  return !entity.length;
};

// Fetching externalIds is a slow process, so we only do it once per minute
// This will be called from cron job
// It will update the externalId of the entity to cetain strings if unable to fetch the externalId
// "unknown" if no deviceCredential is found or ipfs is not used
// "unavailable" if ipfs endpoint is not found or ipfs document is not found
let entitiesBusyLoading = false;
// Helper function to fetch "asset/device" entities with null externalId and update them
export const getEntitiesExternalId = async (amount: number) => {
  if (entitiesBusyLoading) return;
  entitiesBusyLoading = true;

  try {
    const unknownEntities = await getEntityDeviceAndNoExternalId(amount);

    const promises = unknownEntities.map(async (e) => {
      const deviceCredsUri = e.linkedResource.find((lr) =>
        lr.id.includes("deviceCredential")
      )?.serviceEndpoint;
      // if not ipfs endpoint then return entity as is, only handling ipfs now
      if (!deviceCredsUri || !deviceCredsUri.includes("ipfs:")) {
        updateEntityExternalId({ id: e.id, externalId: "unknown" });
        return;
      }

      try {
        const doc = await getIpfsDocument(deviceCredsUri.replace("ipfs:", ""));
        if (!doc) {
          updateEntityExternalId({ id: e.id, externalId: "unavailable" });
          return;
        }

        const buffer = Buffer.from(doc.data);
        const json = JSON.parse(buffer.toString());
        if (!json) return;
        let externalId: string;

        // handling for cookstoves, can add more below if device credential looks different
        let cookstoveCredentialId: string[];
        cookstoveCredentialId = json.credentialSubject?.id?.split(
          "emerging.eco/devices/"
        );
        if (!cookstoveCredentialId || cookstoveCredentialId.length < 2)
          cookstoveCredentialId = json.credentialSubject?.id?.split("?id=");
        if (!cookstoveCredentialId || cookstoveCredentialId.length < 2) return;
        externalId = cookstoveCredentialId[1];

        if (!externalId) return;
        await updateEntityExternalId({ id: e.id, externalId: externalId });
      } catch (error) {
        // Permanent-looking gateway errors (404 not found, 502/504 the
        // gateway can't reach the underlying IPFS block) → mark as
        // "unavailable" so the cron stops retrying these every minute.
        // Transient errors (timeouts without a status, 5xx other than
        // 502/504, network blips) are left null so the next cron run
        // picks them up again.
        const msg = (error as Error)?.message ?? "";
        if (/\[(404|502|504)\]/.test(msg)) {
          await updateEntityExternalId({
            id: e.id,
            externalId: "unavailable",
          });
        } else {
          console.error(error);
        }
      }
    });

    // chunk promises to avoid memory heap, rate limit and db connection issues
    for (let promisesChunk of chunkArray(promises, 4)) {
      await Promise.all(promisesChunk);
    }
  } catch (error) {
    console.error("ERROR::getEntitiesExternalId:: ", error);
  } finally {
    entitiesBusyLoading = false;
  }
};
