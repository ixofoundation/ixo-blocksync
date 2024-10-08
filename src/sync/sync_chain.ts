import { createQueryClient, createRegistry } from "@ixo/impactxclient-sdk";
import * as Proto from "../util/proto";
import { RPC, STATIC_CHAIN_ID } from "../util/secrets";
import { sleep } from "../util/sleep";
import { ChainCore, getCoreChain } from "../postgres/blocksync_core/chain";
import { Chain, createChain, getChain } from "../postgres/chain";

export let currentChain: Chain;
export let queryClient: Awaited<ReturnType<typeof createQueryClient>>;
export let registry: ReturnType<typeof createRegistry>;

export const syncChain = async () => {
  try {
    registry = createRegistry();

    let chainId: string;
    if (STATIC_CHAIN_ID) {
      // if want to run without needing above rpc endpoint, can use this instead and comment above
      chainId = STATIC_CHAIN_ID;
    } else {
      queryClient = await createQueryClient(RPC);
      const res = await Proto.getLatestBlock();
      chainId = res?.block?.header?.chainId || "";
      if (!chainId) throw new Error("No Chain Found on RPC Endpoint");
    }

    let coreChain: ChainCore | undefined;
    while (true) {
      try {
        coreChain = await getCoreChain(chainId);
        break;
      } catch (error) {
        console.log("Waiting for Blocksync-core to start...");
        await sleep(10000);
      }
    }
    if (!coreChain)
      throw new Error(
        "No Chain Found on Blocksync-core DB for this RPC Endpoint"
      );

    const existingChain = await getChain(coreChain.chainId);
    if (existingChain) {
      currentChain = existingChain;
      return;
    }

    const newChain = await createChain({
      chainId: coreChain.chainId,
      blockHeight: 1,
    });
    currentChain = newChain;
    return;
  } catch (error) {
    console.error(`Error occured duting initiation: ${error}`);
    process.exit();
  }
};
