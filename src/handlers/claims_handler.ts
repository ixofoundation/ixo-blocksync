import { parseJson, prisma } from "../prisma/prisma_client";
import { customQueries } from "@ixo/impactxclient-sdk";
import { chunkArray } from "../util/helpers";

export const getCollectionById = async (id: string, includeClaims = false) => {
  const collection = await prisma.claimCollection.findFirst({
    where: {
      id: id,
    },
    include: {
      Claim: includeClaims,
    },
  });
  if (!collection) throw new Error("Collection not found");
  collection!.payments = parseJson(collection!.payments);
  return collection;
};

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
        cursor: { aid: Number(cursor) },
        skip: 1,
      }),
      include: {
        evaluation: true,
      },
      orderBy: { aid: orderBy },
    });

  // get claims with schemaType null and fetch schemaType from cellnode
  let claims = await query("8000", cleanStatus, null);
  await getClaimTypesFromCellnode(id, claims);

  // if any more claims with schemaType null, return empty list
  claims = await query("1", cleanStatus, null);
  if (claims.length && !!type) {
    return {
      data: [],
      metaData: {
        cursor: null,
        hasNextPage: false,
        schemaTypesLoaded: false,
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
      },
    };
  }
  const nextCursor: any = claims[claims.length - 1].aid;
  const nextPage = await query("1", cleanStatus, type, nextCursor);
  return {
    data: claims,
    metaData: {
      cursor: nextCursor,
      hasNextPage: nextPage.length > 0,
      schemaTypesLoaded: true,
    },
  };
};

export const getClaimById = async (id: string) => {
  const claim = await prisma.claim.findFirst({
    where: {
      claimId: id,
    },
    include: {
      evaluation: true,
    },
  });
  if (!claim) throw new Error("Claim not found");
  claim!.paymentsStatus = parseJson(claim!.paymentsStatus);
  return claim;
};

export const getClaimTypesFromCellnode = async (
  collectionID: string,
  claims: any[]
) => {
  // Get Collection Entity to get Collection Cellnode Service URI
  const collection = await getCollectionById(collectionID);
  const entity = await prisma.entity.findFirst({
    where: { id: collection.entity },
    include: { IID: { include: { service: true } } },
  });
  const cellnodeUri = entity!.IID.service.find((s) =>
    s.id.includes("cellnode")
  );
  if (!cellnodeUri) throw new Error("Cellnode service not found");

  // fetch schemaType from cellnode
  const promises = claims.map(async (c) => {
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
