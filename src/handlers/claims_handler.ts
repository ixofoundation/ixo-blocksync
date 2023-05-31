import { parseJson, prisma } from "../prisma/prisma_client";
import { customQueries } from "@ixo/impactxclient-sdk";
import { Claim } from "@prisma/client";

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

export const getCollectionClaims = async (
  id: string,
  status?: string,
  type?: string
) => {
  const cleanStatus = status ? parseInt(status) : null;
  const claims = await prisma.claim.findMany({
    where: {
      AND: [
        {
          collectionId: id,
        },
        type
          ? {
              OR: [{ schemaType: type }, { schemaType: null }],
            }
          : {},
        !cleanStatus
          ? {}
          : cleanStatus === 0
          ? { evaluation: null }
          : { evaluation: { status: cleanStatus } },
      ],
    },
    take: 50000,
    include: {
      evaluation: true,
    },
  });

  if (type) {
    // Get Collection Entity to get Collection Cellnode Service URI
    const collection = await getCollectionById(id);
    const entity = await prisma.entity.findFirst({
      where: {
        id: collection.entity,
      },
      include: {
        IID: {
          include: {
            service: true,
          },
        },
      },
    });
    const cellnodeUri = entity!.IID.service.find((s) =>
      s.id.includes("cellnode")
    );

    if (!cellnodeUri) return [];

    const correctClaims = claims.filter((c) => c.schemaType === type);
    const promises = claims
      .filter((c) => !c.schemaType)
      .map(async (c) => {
        const res = await customQueries.cellnode.getPublicDoc(
          c.claimId,
          cellnodeUri!.serviceEndpoint
        );
        if (!res) return null;
        const type: string =
          (res.type || []).find((t) => t.includes("claim:")) ||
          (res.type || []).find((t) => t.includes("ixo:")) ||
          (res.type || []).find((t) => !!t);
        if (!type) return null;
        const typeSplit = type.split(":");
        const claim = await prisma.claim.update({
          where: {
            claimId: c.claimId,
          },
          data: {
            schemaType: typeSplit[typeSplit.length - 1],
          },
        });
        return claim;
      });
    const res = await Promise.all(promises);
    const correctClaims2 = res.filter((c) => c?.schemaType === type) as any[];

    return correctClaims.concat(correctClaims2);
  }

  return claims;
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
