import { customQueries } from "@ixo/impactxclient-sdk";
import { chunkArray } from "../util/helpers";
import {
  getCollectionClaimsByType,
  getCollectionClaimsTypeNull,
  getCollectionsClaimTypeNull,
  getCollectionEntity,
  updateClaimSchema,
} from "../postgres/claim";
import { getEntityService } from "../postgres/entity";

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
  const cleanTake = Number(take || 1000);

  const query = async (take: number, type?: string | null, cursor?: string) =>
    await getCollectionClaimsByType({
      collectionId: id,
      includeType: type !== undefined,
      type: type ?? null,
      includeStatus: cleanStatus !== undefined,
      status: cleanStatus ?? null,
      orderBy: orderBy,
      take: take || 1000,
      cursor: cursor ?? null,
    });

  // get claims with schemaType null and fetch schemaType from cellnode if claims exist
  let claims = await query(1, null);
  if (claims.length && !!type) {
    await getClaimTypesFromCellnode(id);

    // if any more claims with schemaType null, return empty list
    claims = await query(1, null);
  }

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

  // plus 1 to check if there is a next page
  claims = await query(cleanTake + 1, type, cursor);

  // if no claims then return empty list
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

  const hasNextPage = claims.length > cleanTake;
  // data returned is all claims, except the last one if there is a next page
  if (hasNextPage) claims.pop();

  return {
    data: claims,
    metaData: {
      cursor: claims[claims.length - 1].claimId,
      hasNextPage: hasNextPage,
      schemaTypesLoaded: true,
      message: "Success",
    },
  };
};

export const getCollectionClaimSchemaTypesLoaded = async (id?: string) => {
  if (!id) return false;
  const claims = await getCollectionClaimsTypeNull(id, 1);
  return claims.length == 0;
};

let isFetchingClaimsSchemaTypes = false;
// Helper  function to get all collections with claims that have no schemaType
// and then get the schemaType from cellnode
export const getAllClaimTypesFromCellnode = async () => {
  if (isFetchingClaimsSchemaTypes) return;
  isFetchingClaimsSchemaTypes = true;
  try {
    const collections = await getCollectionsClaimTypeNull();
    for (let collection of collections) {
      try {
        await getClaimTypesFromCellnode(collection.id);
      } catch (error) {
        // catch at per collection loop level to avoid stopping the whole process
        // uncomment to not fill logs with errors, check this log if debug why some collections are not getting schemaTypes
        // console.error(
        //   "ERROR::getAllClaimTypesFromCellnode::inner:: ",
        //   error.message
        // );
      }
    }
  } catch (error) {
    console.error("ERROR::getAllClaimTypesFromCellnode: ", error.message);
  } finally {
    isFetchingClaimsSchemaTypes = false;
  }
};

export const getClaimTypesFromCellnode = async (collectionID: string) => {
  // first get all claims with type null
  const collectionClaims = await getCollectionClaimsTypeNull(collectionID, 150);
  if (collectionClaims.length < 1) return;
  // get Collection Entity to get Collection Cellnode Service URI
  const collectionEntity = await getCollectionEntity(collectionID);
  if (!collectionEntity) return;
  const iid = await getEntityService(collectionEntity.entity);
  const cellnodeUri = iid.service.find((s) => s.id.includes("cellnode"));
  if (!cellnodeUri) throw new Error("Cellnode service not found");

  // promises to fetch schemaType from cellnode
  const promises = collectionClaims.map(async (c) => {
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
      if (type) {
        await updateClaimSchema(c.claimId, type);
      }
    }
  });

  // chunk promises to avoid memory heap, rate limit and db connection issues
  for (let promisesChunk of chunkArray(promises, 4)) {
    await Promise.all(promisesChunk);
  }
};
