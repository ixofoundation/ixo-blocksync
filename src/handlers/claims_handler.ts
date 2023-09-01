import { prisma } from "../prisma/prisma_client";
import { customQueries } from "@ixo/impactxclient-sdk";
import { chunkArray } from "../util/helpers";

let isFetchingClaimsSchemaTypes = false;

export const getCollectionById = async (id: string) => {
  const collection = await prisma.claimCollection.findFirst({
    where: { id: id },
    select: {
      entity: true,
      Claim: {
        where: { schemaType: null },
        take: 10000,
      },
    },
  });
  return collection;
};

export const getAllCollectionClaimTypesNull = async () => {
  return await prisma.claimCollection.findMany({
    where: {
      Claim: {
        some: { schemaType: null },
      },
    },
    select: { id: true },
  });
};

// Helper  function to get all collections with claims that have no schemaType
// and then get the schemaType from cellnode
export const getAllClaimTypesFromCellnode = async () => {
  if (isFetchingClaimsSchemaTypes) return;
  isFetchingClaimsSchemaTypes = true;
  try {
    const collections = await getAllCollectionClaimTypesNull();
    for (let collection of collections) {
      await getClaimTypesFromCellnode(collection.id);
    }
  } catch (error) {
    console.error("ERROR::getAllClaimTypesFromCellnode: ", error.message);
  } finally {
    isFetchingClaimsSchemaTypes = false;
  }
};

export const getClaimTypesFromCellnode = async (collectionID: string) => {
  // Get Collection Entity to get Collection Cellnode Service URI
  const collection = await getCollectionById(collectionID);
  if (!collection || collection.Claim.length < 1) return;
  const entity: any = await prisma.entity.findFirst({
    where: { id: collection.entity },
    select: { IID: { select: { service: true } } },
  });
  const cellnodeUri = entity.IID.service.find((s) => s.id.includes("cellnode"));
  if (!cellnodeUri) throw new Error("Cellnode service not found");

  // fetch schemaType from cellnode
  const promises = collection.Claim.map(async (c) => {
    let type: string | null = null;
    try {
      const res = await customQueries.cellnode.getPublicDoc(
        c.claimId,
        cellnodeUri.serviceEndpoint
      );
      type =
        (res.type || []).find((t) => t.includes("claim:")) ||
        (res.type || []).find((t) => t.includes("ixo:")) ||
        (res.type || []).find((t) => !!t);
      if (!type) throw new Error("Claim type not found");
      const typeSplit = type!.split(":");
      type = typeSplit[typeSplit.length - 1];
    } catch (error) {
      // if error 404 then claim not on cellnode, type "unknown"
      if (error.response?.status === 404) type = "unknown";
      else console.error(error.message);
    } finally {
      if (type)
        await prisma.claim.update({
          where: { claimId: c.claimId },
          data: { schemaType: type },
        });
    }
  });
  for (let promisesChunk of chunkArray(promises, 5)) {
    await Promise.all(promisesChunk);
  }
};
