import * as BondHandler from "../handlers/bond_handler";
import { MsgTypes, MsgTypesArray } from "../types/Msg";
import {
  MsgBuy,
  MsgCreateBond,
  MsgEditBond,
  MsgMakeOutcomePayment,
  MsgSell,
  MsgSetNextAlpha,
  MsgSwap,
  MsgUpdateBondState,
  MsgWithdrawReserve,
  MsgWithdrawShare,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/bonds/v1beta1/tx";
import { decodeMessage, decodeTransaction } from "../util/proto";
import { TxResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/abci/v1beta1/abci";

export const syncBlock = async (
  transactions: TxResponse[],
  blockHeight: string,
  timestamp: string
) => {
  if (transactions.length === 0) return;

  for (const transaction of transactions) {
    // if no transaction or transaction failed, continue
    if (!transaction.tx || transaction.code != 0) continue;

    const tx = decodeTransaction(transaction);
    for (const message of tx?.tx?.body?.messages || []) {
      // if no message to handle, continue
      if (!MsgTypesArray.includes(message.typeUrl)) continue;

      try {
        const msg = {
          type: message.typeUrl,
          value: decodeMessage(message),
        };
        switch (msg.type) {
          case MsgTypes.createBond:
            const createBond: MsgCreateBond = msg.value;
            await BondHandler.createBond({
              bondDid: createBond.bondDid,
              token: createBond.token,
              name: createBond.name,
              description: createBond.description,
              functionType: createBond.functionType,
              functionParamaters: JSON.stringify(createBond.functionParameters),
              creatorDid: createBond.creatorDid,
              controllerDid: createBond.controllerDid,
              reserveTokens: createBond.reserveTokens,
              txFeePercentage: createBond.txFeePercentage,
              exitFeePercentage: createBond.exitFeePercentage,
              feeAddress: createBond.feeAddress,
              reserveWithdrawalAddress: createBond.reserveWithdrawalAddress,
              maxSupply: JSON.stringify(createBond.maxSupply),
              orderQuantityLimits: JSON.stringify(
                createBond.orderQuantityLimits
              ),
              sanityRate: createBond.sanityRate,
              sanityMarginPercentage: createBond.sanityMarginPercentage,
              allowSells: createBond.allowSells,
              allowReserveWithdrawals: createBond.allowReserveWithdrawals,
              alphaBond: createBond.alphaBond,
              batchBlocks: createBond.batchBlocks,
              creatorAddress: createBond.creatorAddress,
            });
            break;
          case MsgTypes.editBond:
            const editBond: MsgEditBond = msg.value;
            await BondHandler.editBond({
              bondDid: editBond.bondDid,
              name: editBond.name,
              description: editBond.description,
              orderQuantityLimits: editBond.orderQuantityLimits,
              sanityRate: editBond.sanityRate,
              sanityMarginPercentage: editBond.sanityMarginPercentage,
              editorDid: editBond.editorDid,
              editorAddress: editBond.editorAddress,
            });
          case MsgTypes.setNextAlpha:
            const setNextAlpha: MsgSetNextAlpha = msg.value;
            await BondHandler.createAlpha({
              bondDid: setNextAlpha.bondDid,
              alpha: setNextAlpha.alpha,
              delta: setNextAlpha.delta,
              oracleDid: setNextAlpha.oracleDid,
              oracleAddress: setNextAlpha.oracleAddress,
              height: blockHeight,
              timestamp: timestamp,
            });
            break;
          case MsgTypes.updateBondState:
            const updateBondState: MsgUpdateBondState = msg.value;
            await BondHandler.updateBondState({
              bondDid: updateBondState.bondDid,
              status: updateBondState.state,
              editorDid: updateBondState.editorDid,
              editorAddress: updateBondState.editorAddress,
            });
            break;
          case MsgTypes.buy:
            const bondBuy: MsgBuy = msg.value;
            await BondHandler.createBuy({
              bondDid: bondBuy.bondDid,
              buyerDid: bondBuy.buyerDid,
              buyerAddress: bondBuy.buyerAddress,
              amount: bondBuy.amount?.amount || "",
              maxPrices: JSON.stringify(bondBuy.maxPrices),
            });
            break;
          case MsgTypes.sell:
            const bondSell: MsgSell = msg.value;
            await BondHandler.createSell({
              bondDid: bondSell.bondDid,
              sellerDid: bondSell.sellerDid,
              sellerAddress: bondSell.sellerAddress,
              amount: bondSell.amount?.amount || "",
            });
          case MsgTypes.swap:
            const bondSwap: MsgSwap = msg.value;
            await BondHandler.createSwap({
              bondDid: bondSwap.bondDid,
              swapperDid: bondSwap.swapperAddress,
              swapperAddress: bondSwap.swapperAddress,
              from: JSON.stringify(bondSwap.from),
              toToken: bondSwap.toToken,
            });
            break;
          case MsgTypes.makeOutcomePayment:
            const makeOutcomePayment: MsgMakeOutcomePayment = msg.value;
            await BondHandler.createOutcomePayment({
              bondDid: makeOutcomePayment.bondDid,
              senderDid: makeOutcomePayment.senderDid,
              senderAddress: makeOutcomePayment.senderAddress,
              amount: makeOutcomePayment.amount,
              height: blockHeight,
              timestamp: timestamp,
            });
            break;
          case MsgTypes.withdrawShare:
            const withdrawShare: MsgWithdrawShare = msg.value;
            await BondHandler.createShareWithdrawal({
              bondDid: withdrawShare.bondDid,
              recipientDid: withdrawShare.recipientDid,
              recipientAddress: withdrawShare.recipientAddress,
              height: blockHeight,
              timestamp: timestamp,
            });
            break;
          case MsgTypes.withdrawReserve:
            const withdrawReserve: MsgWithdrawReserve = msg.value;
            await BondHandler.createReserveWithdrawal({
              bondDid: withdrawReserve.bondDid,
              withdrawerDid: withdrawReserve.withdrawerDid,
              withdrawerAddress: withdrawReserve.withdrawerAddress,
              amount: JSON.stringify(withdrawReserve.amount),
              height: blockHeight,
              timestamp: timestamp,
            });
            break;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
};
