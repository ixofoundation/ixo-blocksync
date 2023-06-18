import { ConvertedEvent } from "../util/proto";
import { prisma } from "../prisma/prisma_client";
import { getWasmAttr, splitAttributesByKeyValue } from "../util/helpers";
import { ENTITY_MODULE_CONTRACT_ADDRESS } from "../util/secrets";

export const syncWasmEventData = async (event: ConvertedEvent) => {
  try {
    const contractAddress = getWasmAttr(event.attributes, "_contract_address");
    const action = getWasmAttr(event.attributes, "action");

    // if it is a wasm execution on entity module contract address
    if (contractAddress === ENTITY_MODULE_CONTRACT_ADDRESS) {
      const tokenId = getWasmAttr(event.attributes, "token_id");

      if (action === "mint") {
        // use setTimeout to wait for the entity to be created as creation event is after wasm event
        setTimeout(async () => {
          await prisma.entity.update({
            where: { id: tokenId },
            data: { owner: getWasmAttr(event.attributes, "owner") },
          });
        }, 500);
      } else if (action === "transfer_nft") {
        await prisma.entity.update({
          where: { id: tokenId },
          data: { owner: getWasmAttr(event.attributes, "recipient") },
        });
      }
      return;
    }

    // if it is a wasm execution on a token smart contract
    const tokenClass = await prisma.tokenClass.findFirst({
      where: { contractAddress },
    });
    if (tokenClass) {
      // split attributes by action as cosmwasm joins all attributes into one array
      const messages = splitAttributesByKeyValue(event.attributes);
      for (const message of messages) {
        setTimeout(
          async () => {
            await prisma.token.update({
              where: { id: getWasmAttr(message, "token_id") },
              data: {
                tokenTransaction: {
                  create: {
                    from: getWasmAttr(message, "from"),
                    to: getWasmAttr(message, "to"),
                    amount: getWasmAttr(message, "amount"),
                  },
                },
              },
            });
          },
          getWasmAttr(message, "from") ? 0 : 500
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
};
