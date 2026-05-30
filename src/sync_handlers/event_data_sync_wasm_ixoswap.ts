import { getWasmAttr } from "../util/helpers";
import { EventCore } from "../postgres/blocksync_core/block";
import {
  createIxoSwap,
  updateIxoSwapFee,
  updateIxoSwapFrozen,
  updateIxoSwapLPAddress,
  updateIxoSwapMaxSlippagePercent,
  updateIxoSwapNewOwner,
  updateIxoSwapPendingOwner,
  insertIxoSwapPriceHistory,
  IxoSwap,
} from "../postgres/ixo_swap";

export const processIxoSwapEvent = async (
  event: EventCore,
  action: string,
  contractAddress: string,
  timestamp: Date,
  ixoSwap: IxoSwap
) => {
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
        token1155Reserve: getWasmAttr(event.attributes, "token1155_reserve"),
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
        token1155Reserve: getWasmAttr(event.attributes, "token1155_reserve"),
        token2Reserve: getWasmAttr(event.attributes, "token2_reserve"),
        token1155OldReserve: ixoSwap.token_1155_reserve,
        token2OldReserve: ixoSwap.token_2_reserve,
      });
    default:
      throw new Error("Unknown action for ixo-swap: " + action);
  }
};

export const processIxoSwapInstantiate = async (
  event: EventCore,
  contractAddress: string
) => {
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
    protocol_fee_percent: getWasmAttr(event.attributes, "protocol_fee_percent"),
    lp_fee_percent: getWasmAttr(event.attributes, "lp_fee_percent"),
    max_slippage_percent: getWasmAttr(event.attributes, "max_slippage_percent"),
    frozen: false,
    owner: getWasmAttr(event.attributes, "owner"),
    pending_owner: null,
  });
};
