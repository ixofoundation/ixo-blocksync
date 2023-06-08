import { Chain } from "@prisma/client";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import * as Proto from "../util/proto";
import * as ChainHandler from "../handlers/chain_handler";
import { createQueryClient, createRegistry } from "@ixo/impactxclient-sdk";
import { RPC } from "../util/secrets";

export let currentChain: Chain;
export let queryClient: Awaited<ReturnType<typeof createQueryClient>>;
export let registry: ReturnType<typeof createRegistry>;
export let tendermintClient: Awaited<
  ReturnType<typeof Tendermint34Client.connect>
>;

export const syncChain = async () => {
  try {
    queryClient = await createQueryClient(RPC);
    registry = createRegistry();
    tendermintClient = await Tendermint34Client.connect(RPC);

    const res = await Proto.getLatestBlock();
    const chainId = res?.block?.header?.chainId || "";
    if (!chainId) throw new Error("No Chain Found on RPC Endpoint");

    const existingChain = await ChainHandler.getChain(chainId);

    if (existingChain) {
      currentChain = existingChain;
      return;
    }

    const newChain = await ChainHandler.createChain({
      chainId: chainId,
      blockHeight: 1,
    });
    currentChain = newChain;
    return;
  } catch (error) {
    console.log(`Error occured duting initiation: ${error}`);
    process.exit();
  }
};
