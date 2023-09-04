import { prisma } from "../prisma/prisma_client";
import { getWasmAttr, splitAttributesByKeyValue } from "../util/helpers";
import { ENTITY_MODULE_CONTRACT_ADDRESS } from "../util/secrets";
import { GetEventType } from "../types/getBlock";

export const syncWasmEventData = async (event: GetEventType): Promise<any> => {
  try {
    const contractAddress = getWasmAttr(event.attributes, "_contract_address");
    const action = getWasmAttr(event.attributes, "action");

    // if it is a wasm execution on entity module contract address
    if (contractAddress === ENTITY_MODULE_CONTRACT_ADDRESS) {
      const tokenId = getWasmAttr(event.attributes, "token_id");

      if (action === "mint") {
        // if action for entity contract address is mint it means it is a nft minting and since wasm events come before
        // module events it means the entity creation event on entity module didnt happen yet so we need to delay this
        // function until the entity creation event happens, which is after iid creation event, thus the skip 2
        return {
          skip: 2,
          func: async () => {
            await prisma.entity.update({
              where: { id: tokenId },
              data: { owner: getWasmAttr(event.attributes, "owner") },
            });
          },
        };
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
      const messages = splitAttributesByKeyValue(event.attributes as any);
      for (const message of messages) {
        const tokenTransaction = {
          from: getWasmAttr(message, "from"),
          to: getWasmAttr(message, "to"),
          amount: getWasmAttr(message, "amount"),
        };
        if (getWasmAttr(message, "from")) {
          await prisma.token.update({
            where: { id: getWasmAttr(message, "token_id") },
            data: { tokenTransaction: { create: tokenTransaction } },
          });
        } else {
          // if no from it means it is a token minting and since wasm events come before module events it means the token creation
          // event on token module didnt happen yet so we need to delay this function until the token creation event happens
          return {
            skip: 1,
            func: async () => {
              await prisma.token.update({
                where: { id: getWasmAttr(message, "token_id") },
                data: { tokenTransaction: { create: tokenTransaction } },
              });
            },
          };
        }
      }
    }
  } catch (error) {
    console.error(error.message);
  }
};
