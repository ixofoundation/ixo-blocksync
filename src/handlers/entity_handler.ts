import { prisma } from "../prisma/prisma_client";
import { base64ToJson } from "../util/helpers";
import { IPFS_SERVICE_MAPPING } from "../util/secrets";
import { getIpfsDocument } from "./ipfs_handler";

export const getParentEntityById = async (id: string) => {
  return await prisma.entity.findFirst({
    where: { id: id },
    select: {
      IID: {
        select: {
          context: true,
          linkedEntity: true,
          linkedResource: true,
          linkedClaim: true,
          service: true,
        },
      },
    },
  });
};

// Helper function to fetch an entity and all its parents and add it's parents service,
// linkedResource, linkedEntity, linkedClaim to the entity as it inherits them.
export const getFullEntityById = async (id: string, parentEntityLoader?) => {
  const baseEntity: any = await prisma.entity.findFirst({
    where: { id: id },
    include: { IID: true },
  });

  const serviceIds = baseEntity!.IID.service.map((s) => s.id);
  const linkedResourceIds = baseEntity!.IID.linkedResource.map((r) => r.id);

  for (const key of Object.keys(baseEntity!.IID)) {
    if (!baseEntity[key]) baseEntity[key] = baseEntity!.IID[key];
  }
  delete baseEntity!.IID;

  let classVal = baseEntity!.context.find((c) => c.key === "class")?.val;
  if (classVal) {
    while (true) {
      let record: any = parentEntityLoader
        ? await parentEntityLoader.load(classVal)
        : await getParentEntityById(classVal);
      const newClassVal = record?.IID.context.find(
        (c) => c.key === "class"
      )?.val;
      for (const service of record!.IID.service) {
        if (!serviceIds.includes(service.id)) {
          baseEntity!.service.push(service);
          serviceIds.push(service.id);
        }
      }
      for (const linkedResource of record!.IID.linkedResource) {
        if (!linkedResourceIds.includes(linkedResource.id)) {
          baseEntity!.linkedResource.push(linkedResource);
          linkedResourceIds.push(linkedResource.id);
        }
      }
      // if no more parents then break
      if (!newClassVal) break;
      classVal = newClassVal;
    }
  }

  const settings: any = {};
  const settingsArr = baseEntity!.linkedResource.filter(
    (r) => r.type === "Settings"
  );
  baseEntity!.linkedResource = baseEntity!.linkedResource.filter(
    (r) => r.type !== "Settings"
  );
  for (const setting of settingsArr) {
    settings[setting.description] = setting;
  }
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
  const entity = await prisma.entity.findFirst({
    where: { AND: [{ externalId: null }, { type: "asset/device" }] },
    select: { id: true },
  });
  return !entity;
};

// Helper function to fetch "asset/device" entities with null externalId and update them
export const getEntitiesExternalId = async (amount: number, isCron = false) => {
  const unknownEntities = await prisma.entity.findMany({
    where: { AND: [{ externalId: null }, { type: "asset/device" }] },
    select: {
      id: true,
      IID: {
        select: {
          linkedResource: true,
        },
      },
    },
    take: amount,
  });

  const entities = await Promise.all(
    unknownEntities.map(async (e: any) => {
      const deviceCredsUri = e.IID.linkedResource.find((lr) =>
        lr.id.includes("deviceCredential")
      )?.serviceEndpoint;
      // if not ipfs endpoint then return entity as is, only handling ipfs now
      if (!deviceCredsUri || !deviceCredsUri.includes("ipfs:")) return e;

      try {
        const doc = await getIpfsDocument(deviceCredsUri.replace("ipfs:", ""));
        if (!doc) return e;

        const json = base64ToJson(doc.data);
        if (!json) return e;
        let externalId: string;

        // handling for cookstoves, can add more below if device credential looks different
        let cookstoveCredentialId: string[];
        cookstoveCredentialId = json.credentialSubject?.id?.split(
          "emerging.eco/devices/"
        );
        if (!cookstoveCredentialId || cookstoveCredentialId.length < 2)
          cookstoveCredentialId = json.credentialSubject?.id?.split("?id=");
        if (!cookstoveCredentialId || cookstoveCredentialId.length < 2)
          return e;
        externalId = cookstoveCredentialId[1];

        if (!externalId) return e;
        return await prisma.entity.update({
          where: { id: e.id },
          data: {
            externalId: externalId,
          },
        });
      } catch (error) {
        // if isCron the fail silently
        if (!isCron) console.error(error);
        return e;
      }
    })
  );

  return entities;
};
