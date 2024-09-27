import { getWasmAttr, splitAttributesByKeyValue } from "../util/helpers";
import { ENTITY_MODULE_CONTRACT_ADDRESS } from "../util/secrets";
import { DelayedFunction } from "./event_sync_handler";
import { EventCore } from "../postgres/blocksync_core/block";
import { updateEntityOwner } from "../postgres/entity";
import { createTokenTransaction } from "../postgres/token";
import {
  createIxoSwap,
  updateIxoSwapFee,
  updateIxoSwapFrozen,
  updateIxoSwapLPAddress,
  updateIxoSwapMaxSlippagePercent,
  updateIxoSwapNewOwner,
  updateIxoSwapPendingOwner,
  insertIxoSwapPriceHistory,
  getIxoSwapReserves,
} from "../postgres/ixo_swap";
import { getCachedTokenClassContractAddress } from "../util/local-cache";

// General note for future, wasm contract initiations emit an event of type "instantiate" instead of "wasm" with the contract
// code id that was initiated might want to use this in future if want to index other smart contract like cw20 etc.

// TODO: re-design the whole getWasmAttr function and see if can make into Map so dont need to filter whole array everytime looking for
//       wasm action attributes

export const syncWasmEventData = async (
  event: EventCore,
  timestamp: Date
): Promise<void | DelayedFunction> => {
  try {
    const contractAddress = getWasmAttr(event.attributes, "_contract_address");

    // --------------------------------------------------------------------------------
    // Entity Module
    // --------------------------------------------------------------------------------
    // wasm execution on entity module contract address, then do handling to set owner of entity
    if (contractAddress === ENTITY_MODULE_CONTRACT_ADDRESS) {
      const action = getWasmAttr(event.attributes, "action");

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
        return await updateEntityOwner({
          id: getWasmAttr(event.attributes, "token_id"),
          owner: getWasmAttr(event.attributes, "recipient"),
        });
      }
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

        // if no from and to it means it is anohter wasm action, like approve_all, so no token transaction
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
          // if no from it means it is a token minting and since wasm events come before module events it means the token creation
          // event on token module didnt happen yet so we need to delay this function until the token creation event happens
          // it is safe to return here already inside the for loop as 1155 wasm miont event will always be alone due to being followed
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
    const action = getWasmAttr(event.attributes, "action");
    const ixoSwap = await getIxoSwapReserves(contractAddress);

    // if ixo-swap exists, then handle it's different actions
    if (ixoSwap) {
      switch (action) {
        case "instantiate-lp-token":
          return await updateIxoSwapLPAddress({
            address: contractAddress,
            lpAddress: getWasmAttr(
              event.attributes,
              "liquidity_pool_token_address"
            ),
          });
        case "freeze-deposits":
          return await updateIxoSwapFrozen({
            address: contractAddress,
            frozen: getWasmAttr(event.attributes, "frozen") === "true",
          });
        case "transfer-ownership":
          return await updateIxoSwapPendingOwner({
            address: contractAddress,
            pendingOwner: getWasmAttr(event.attributes, "pending_owner"),
          });
        case "claim-ownership":
          return await updateIxoSwapNewOwner({
            address: contractAddress,
            owner: getWasmAttr(event.attributes, "owner"),
          });
        case "update-slippage":
          return await updateIxoSwapMaxSlippagePercent({
            address: contractAddress,
            maxSlippagePercent: getWasmAttr(
              event.attributes,
              "max_slippage_percent"
            ),
          });
        case "update-fee":
          return await updateIxoSwapFee({
            address: contractAddress,
            lpFeePercent: getWasmAttr(event.attributes, "lp_fee_percent"),
            protocolFeePercent: getWasmAttr(
              event.attributes,
              "protocol_fee_percent"
            ),
            protocolFeeRecipient: getWasmAttr(
              event.attributes,
              "protocol_fee_recipient"
            ),
          });
        // for now we dont care about the distinctive attributes, only the reserves and the price history
        case "add-liquidity":
        case "remove-liquidity":
          return await insertIxoSwapPriceHistory({
            address: contractAddress,
            timestamp,
            token1155Reserve: getWasmAttr(
              event.attributes,
              "token1155_reserve"
            ),
            token2Reserve: getWasmAttr(event.attributes, "token2_reserve"),
          });
        case "cross-contract-swap":
        case "swap":
          // console.log({
          //   contractAddress,
          //   token_1155_reserve: ixoSwap.token_1155_reserve,
          //   token_2_reserve: ixoSwap.token_2_reserve,
          // });
          return await insertIxoSwapPriceHistory({
            address: contractAddress,
            timestamp,
            token1155Reserve: getWasmAttr(
              event.attributes,
              "token1155_reserve"
            ),
            token2Reserve: getWasmAttr(event.attributes, "token2_reserve"),
            token1155OldReserve: ixoSwap.token_1155_reserve,
            token2OldReserve: ixoSwap.token_2_reserve,
          });
        default:
          throw new Error("Unknown action for ixo-swap: " + action);
      }
    }

    // if ixo-swap instantiation, then save the new contract details to ixo_swap table
    if (action === "instantiate-ixo-swap") {
      return await createIxoSwap({
        address: contractAddress,
        lp_address: "", // set as empty string next event will be liquidity pool initialization
        token_1155_denom: getWasmAttr(event.attributes, "token_1155_denom"),
        token_1155_reserve: BigInt("0"),
        token_2_denom: getWasmAttr(event.attributes, "token_2_denom"),
        token_2_reserve: BigInt("0"),
        protocol_fee_recipient: getWasmAttr(
          event.attributes,
          "protocol_fee_recipient"
        ),
        protocol_fee_percent: getWasmAttr(
          event.attributes,
          "protocol_fee_percent"
        ),
        lp_fee_percent: getWasmAttr(event.attributes, "lp_fee_percent"),
        max_slippage_percent: getWasmAttr(
          event.attributes,
          "max_slippage_percent"
        ),
        frozen: false,
        owner: getWasmAttr(event.attributes, "owner"),
        pending_owner: null,
      });
    }
  } catch (error) {
    console.error("ERROR::syncWasmEventData:: ", error.message);
  }
};
