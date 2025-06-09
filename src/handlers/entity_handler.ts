import { ParentEntityLoader } from "../graphql/entity";
import {
  getEntityAndIid,
  getEntityDeviceAndNoExternalId,
  getEntityParentIid,
  updateEntityExternalId,
} from "../postgres/entity";
import { base64ToJson, chunkArray } from "../util/helpers";
import { IPFS_SERVICE_MAPPING } from "../util/secrets";
import { getIpfsDocument } from "./ipfs_handler";

export const getParentEntityById = async (id: string) => {
  return await getEntityParentIid(id);
};

// Helper function to fetch an entity and all its parents and add it's parents service,
// linkedResource, linkedEntity, linkedClaim to the entity as it inherits them.
export const getFullEntityById = async (
  id: string,
  parentEntityLoader?: ParentEntityLoader
) => {
  const baseEntity = await getEntityAndIid(id);
  if (!baseEntity) throw new Error("ERROR::getFullEntityById");

  // Use Sets instead of arrays for O(1) lookup performance
  const serviceIdSet = new Set(baseEntity.service.map((s) => s.id));
  const linkedResourceIdSet = new Set(
    baseEntity.linkedResource.map((r) => r.id)
  );

  // Process parent entities and inherit their properties
  let classVal = baseEntity.context.find((c) => c.key === "class")?.val;
  if (classVal) {
    while (true) {
      const record = parentEntityLoader
        ? await parentEntityLoader.load(classVal)
        : await getParentEntityById(classVal);
      if (!record) break;

      // Add parent services if not already present
      for (const service of record.service) {
        if (!serviceIdSet.has(service.id)) {
          baseEntity.service.push(service);
          serviceIdSet.add(service.id);
        }
      }

      // Add parent linked resources if not already present
      for (const linkedResource of record.linkedResource) {
        if (!linkedResourceIdSet.has(linkedResource.id)) {
          baseEntity.linkedResource.push(linkedResource);
          linkedResourceIdSet.add(linkedResource.id);
        }
      }

      // Check for next parent in the chain
      const newClassVal = record.context.find((c) => c.key === "class")?.val;
      if (!newClassVal) break;
      classVal = newClassVal;
    }
  }

  // Process settings in a single pass
  const settings: any = {};
  const nonSettingsResources: any[] = [];

  for (const resource of baseEntity.linkedResource) {
    if (resource.type === "Settings") {
      // only add settings if not already added, otherwise parents will override childs
      if (!settings[resource.description]) {
        settings[resource.description] = resource;
      }
    } else {
      nonSettingsResources.push(resource);
    }
  }

  baseEntity.linkedResource = nonSettingsResources;
  baseEntity["settings"] = settings;

  // Custom
  if (IPFS_SERVICE_MAPPING) {
    baseEntity.service = baseEntity.service.map((s) =>
      s.id.includes("ipfs")
        ? { ...s, serviceEndpoint: IPFS_SERVICE_MAPPING }
        : s
    );
  }

  return baseEntity;
};

export const deviceExternalIdsLoaded = async () => {
  const entity = await getEntityDeviceAndNoExternalId(1);
  return !entity.length;
};

// TODO: see if can improve below, maybe checked list or something?
let entitiesBusyLoading = false;
// Helper function to fetch "asset/device" entities with null externalId and update them
export const getEntitiesExternalId = async (amount: number, isCron = false) => {
  if (entitiesBusyLoading) return;
  entitiesBusyLoading = true;

  try {
    const unknownEntities = await getEntityDeviceAndNoExternalId(amount);

    const promises = unknownEntities.map(async (e) => {
      const deviceCredsUri = e.linkedResource.find((lr) =>
        lr.id.includes("deviceCredential")
      )?.serviceEndpoint;
      // if not ipfs endpoint then return entity as is, only handling ipfs now
      if (!deviceCredsUri || !deviceCredsUri.includes("ipfs:")) return;

      try {
        const doc = await getIpfsDocument(deviceCredsUri.replace("ipfs:", ""));
        if (!doc) return;

        const json = base64ToJson(doc.data);
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
        // if isCron the fail silently
        if (!isCron) console.error(error);
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
