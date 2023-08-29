import { GetBlockByHeightResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/tendermint/v1beta1/query";
import { GetTxsEventResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/service";
import { prisma } from "../prisma/prisma_client";
import { upperHexFromUint8Array } from "../util/helpers";

export const createBlock = async (
  blockHeight: number,
  timestamp: Date,
  block: GetBlockByHeightResponse,
  txsEvent: GetTxsEventResponse
) => {
  try {
    const blockDoc = {
      height: blockHeight,
      hash: upperHexFromUint8Array(block.blockId!.hash!),
      num_txs: txsEvent.txs.length,
      total_gas: txsEvent.txResponses.reduce(
        (acc, txRes) => acc + txRes.gasUsed.low,
        0
      ),
      proposer_address: upperHexFromUint8Array(
        block!.block!.header!.proposerAddress
      ),
      timestamp: timestamp,
    };
    const res = await prisma.block.create({ data: blockDoc });
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const isBlockSynced = async (blockHeight: number) => {
  const res = await prisma.block.findFirst({
    where: { height: blockHeight },
  });
  if (res !== null) {
    return true;
  } else {
    return false;
  }
};
