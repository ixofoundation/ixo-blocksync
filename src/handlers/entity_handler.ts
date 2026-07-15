import {
  getEntityDeviceAndNoExternalId,
  updateEntityExternalId,
} from "../postgres/entity";
import { chunkArray } from "../util/helpers";
import { getIpfsDocument } from "./ipfs_handler";

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
