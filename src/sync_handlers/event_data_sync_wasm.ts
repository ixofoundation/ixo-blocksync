import { getWasmAttr, splitAttributesByKeyValue } from "../util/helpers";
import { ENTITY_MODULE_CONTRACT_ADDRESS } from "../util/secrets";
import { DelayedFunction } from "./event_sync";
import { BlockCore, EventCore } from "../postgres/blocksync_core/block";
import { updateEntityOwner } from "../postgres/entity";
import { createTokenTransaction } from "../postgres/token";
import { getIxoSwapReserves } from "../postgres/ixo_swap";
import { getCachedTokenClassContractAddress } from "../util/local-cache";
import { getDaoContractInfo } from "../postgres/dao";
import {
  processDaodaoInstantiateEvent,
  processDaoEvent,
} from "./event_data_sync_wasm_dao";
import {
  processIxoSwapEvent,
  processIxoSwapInstantiate,
} from "./event_data_sync_wasm_ixoswap";
import { createWasmInstantiate } from "../postgres/wasm";
import { DAODAO_CONTRACT_CODE_IDS } from "../constants/wasm_code_ids";

// TODO: re-design the whole getWasmAttr function and see if can make into Map so dont need to filter whole array every time looking for wasm action attributes

export const syncWasmEventData = async (
  event: EventCore,
  block: BlockCore
): Promise<void | DelayedFunction> => {
  try {
    const contractAddress = getWasmAttr(event.attributes, "_contract_address");
    const action = getWasmAttr(event.attributes, "action");

    // --------------------------------------------------------------------------------
    // Wasm Instantiate
    // --------------------------------------------------------------------------------
    // If wasm event is instantiate, then save the new contract details to wasm_instantiate table
    if (event.type === "instantiate") {
      const msgIndex = getWasmAttr(event.attributes, "msg_index");
      const codeId = parseInt(getWasmAttr(event.attributes, "code_id") || "0");
      await createWasmInstantiate({
        address: contractAddress,
        code_id: codeId,
        created_at: block.time,
        block_height: block.height,
        msg_index: msgIndex ? parseInt(msgIndex) : null,
      });

      // daodao cw4 and cw20 staked voting modules instantiation needs to create table entries
      await processDaodaoInstantiateEvent({
        contractAddress,
        contractType: DAODAO_CONTRACT_CODE_IDS.get(codeId) || "",
        blockHeight: block.height,
      });
      return;
    }

    // --------------------------------------------------------------------------------
    // Entity Module
    // --------------------------------------------------------------------------------
    // wasm execution on entity module contract address, then do handling to set owner of entity
    if (contractAddress === ENTITY_MODULE_CONTRACT_ADDRESS) {
      if (action === "mint") {
        // if action for entity contract address is mint it means it is a nft minting and since wasm events come before
        // module events it means the entity creation event on entity module didnt happen yet so we need to delay this
        // function until the entity creation event happens, which is after iid creation event, thus the skip 2
        return {
          skip: 2,
          func: async () => {
            await updateEntityOwner({
              owner: getWasmAttr(event.attributes, "owner"),
              id: getWasmAttr(event.attributes, "token_id"),
            });
          },
        };
      } else if (action === "transfer_nft") {
        await updateEntityOwner({
          id: getWasmAttr(event.attributes, "token_id"),
          owner: getWasmAttr(event.attributes, "recipient"),
        });
      }
      return;
    }

    // --------------------------------------------------------------------------------
    // Token Module
    // --------------------------------------------------------------------------------
    // token module smart contract handling
    const tokenClass = await getCachedTokenClassContractAddress(
      contractAddress
    );
    if (tokenClass) {
      // split attributes by action as cosmwasm joins all attributes into one array
      const messages = splitAttributesByKeyValue(event.attributes as any);
      // console.dir(messages);
      for (const message of messages) {
        const from = getWasmAttr(message, "from");
        const to = getWasmAttr(message, "to");

        // if no from and to it means it is another wasm action, like approve_all, so no token transaction
        if (!from && !to) continue;
        // if from and to are the same it means it is a transfer to self, no need to track it as TokenTransaction id for amounts
        if (from === to) continue;

        const tokenTransaction = {
          from,
          to,
          amount: BigInt(getWasmAttr(message, "amount") ?? 0),
          tokenId: getWasmAttr(message, "token_id"),
        };
        if (from) {
          await createTokenTransaction(tokenTransaction);
        } else {
          // if no "from" it means it is a token minting and since wasm events come before module events it means the token creation
          // event on token module didn't happen yet so we need to delay this function until the token creation event happens
          // it is safe to return here already inside the for loop as 1155 wasm mint event will always be alone due to being followed
          // by a ixo.token.v1beta1.TokenMintedEvent event, so wasm module cant batch minting tokens through token module
          return {
            skip: 1,
            func: async () => {
              await createTokenTransaction(tokenTransaction);
            },
          };
        }
      }
      return;
    }

    // --------------------------------------------------------------------------------
    // ixo-swap
    // --------------------------------------------------------------------------------
    const ixoSwap = await getIxoSwapReserves(contractAddress);

    // if ixo-swap exists, then handle it's different actions
    if (ixoSwap) {
      await processIxoSwapEvent(
        event,
        action,
        contractAddress,
        block.time,
        ixoSwap
      );
      return;
    }

    // if ixo-swap instantiation, then save the new contract details to ixo_swap table
    if (action === "instantiate-ixo-swap") {
      await Promise.all([
        processIxoSwapInstantiate(event, contractAddress),
        createWasmInstantiate({
          address: contractAddress,
          code_id: parseInt(getWasmAttr(event.attributes, "code_id") || "0"),
          created_at: block.time,
          block_height: block.height,
          msg_index: parseInt(
            getWasmAttr(event.attributes, "msg_index") || "0"
          ),
        }),
      ]);
      return;
    }

    // --------------------------------------------------------------------------------
    // DAO DAO Contracts
    // --------------------------------------------------------------------------------
    // Check if this is a DAO contract by querying contract info or maintaining a registry
    let daoContractInfo = await getDaoContractInfo(contractAddress);
    // console.log("daoContractInfo", daoContractInfo);

    if (daoContractInfo) {
      await processDaoEvent({
        event,
        timestamp: block.time,
        contractInfo: daoContractInfo,
        blockHeight: block.height,
        action: action || getWasmAttr(event.attributes, "method"),
      });
      return;
    }
  } catch (error) {
    console.error("ERROR::syncWasmEventData:: ", error.message);
    throw error;
  }
};
