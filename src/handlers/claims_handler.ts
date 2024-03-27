import { prisma } from "../prisma/prisma_client";
import { customQueries } from "@ixo/impactxclient-sdk";
import { chunkArray } from "../util/helpers";

/**
 * Will return empty list if not all claims schemaTypes have been fetched from cellnode
 * if empty list, call getCollectionClaims again after 1 minute to avoid cellnode rate limit
 */
export const getCollectionClaims = async (
  id: string,
  status?: string,
  type?: string,
  take?: string,
  cursor?: string,
  orderBy: "asc" | "desc" = "asc"
) => {
  const cleanStatus = status ? parseInt(status) : undefined;

  const query = async (
    take?: string,
    status?: number,
    type?: string | null,
    cursor?: string,
    includeTypeNull = false
  ) =>
    await prisma.claim.findMany({
      where: {
        AND: [
          {
            collectionId: id,
          },
          type === undefined
            ? {}
            : {
                OR: includeTypeNull
                  ? [{ schemaType: type }, { schemaType: null }]
                  : [{ schemaType: type }],
              },
          status === null
            ? {}
            : status === 0
            ? { evaluation: null }
            : { evaluation: { status: status } },
        ],
      },
      take: take ? Number(take) : 1000,
      ...(cursor && {
        cursor: { claimId: cursor },
        skip: 1,
      }),
      include: {
        evaluation: true,
      },
      orderBy: { submissionDate: orderBy },
    });

  // get claims with schemaType null and fetch schemaType from cellnode
  let claims = await query("1", cleanStatus, null);
  if (claims.length && !!type) await getClaimTypesFromCellnode(id);

  // if any more claims with schemaType null, return empty list
  claims = await query("1", cleanStatus, null);
  if (claims.length && !!type) {
    return {
      data: [],
      metaData: {
        cursor: null,
        hasNextPage: false,
        schemaTypesLoaded: false,
        message:
          "Schema types for claims not loaded yet, please try again after 1 minute",
      },
    };
  }

  claims = await query(take, cleanStatus, type, cursor);
  if (claims.length == 0) {
    return {
      data: [],
      metaData: {
        cursor: null,
        hasNextPage: false,
        schemaTypesLoaded: true,
        message: "No claims found",
      },
    };
  }
  const nextCursor = claims[claims.length - 1].claimId;
  const nextPage = await query("1", cleanStatus, type, nextCursor);
  return {
    data: claims,
    metaData: {
      cursor: nextCursor,
      hasNextPage: nextPage.length > 0,
      schemaTypesLoaded: true,
      message: "",
    },
  };
};

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

let isFetchingClaimsSchemaTypes = false;
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

// TODO add graphql to cellnode so we dont cause memory heaps is queries take too long
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
      // if error "Claim type not found" then claim type not extracted from doc, type "extracterror"
      else if (error.message == "Claim type not found") type = "extracterror";
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
