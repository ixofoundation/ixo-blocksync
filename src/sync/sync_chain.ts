import { Chain } from "@prisma/client";
import * as ChainHandler from "../handlers/chain_handler";
import { createQueryClient, createRegistry } from "@ixo/impactxclient-sdk";
import * as Proto from "../util/proto";
import { RPC } from "../util/secrets";
import { prismaCore } from "../prisma/prisma_client";
import { timeout } from "cron";
import { sleep } from "../util/sleep";

export let currentChain: Chain;
export let queryClient: Awaited<ReturnType<typeof createQueryClient>>;
export let registry: ReturnType<typeof createRegistry>;

export const syncChain = async () => {
  try {
    queryClient = await createQueryClient(RPC);
    registry = createRegistry();

    const res = await Proto.getLatestBlock();
    const chainId = res?.block?.header?.chainId || "";
    if (!chainId) throw new Error("No Chain Found on RPC Endpoint");

    let coreChain;
    while (true) {
      try {
        coreChain = await prismaCore.chainCore.findFirst({
          where: { chainId },
        });
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

    const existingChain = await ChainHandler.getChain(coreChain.chainId);
    if (existingChain) {
      currentChain = existingChain;
      return;
    }

    const newChain = await ChainHandler.createChain({
      chainId: coreChain.chainId,
      blockHeight: 1,
    });
    currentChain = newChain;
    return;
  } catch (error) {
    console.log(`Error occured duting initiation: ${error}`);
    process.exit();
  }
};
