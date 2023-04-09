import { prisma } from "../prisma/prisma_client";
import { Chain } from "@prisma/client";

export const createChain = async (chainDoc: Chain) => {
  const existingChain = await prisma.chain.findFirst({
    where: { chainId: chainDoc.chainId },
  });
  if (existingChain) {
    return existingChain;
  } else {
    return prisma.chain.create({ data: chainDoc });
  }
};

export const updateChain = async (chainDoc: Chain) => {
  try {
    const res = await prisma.chain.update({
      where: { chainId: chainDoc.chainId },
      data: { blockHeight: chainDoc.blockHeight },
    });
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getChain = async (chainId: string) => {
  try {
    const res = await prisma.chain.findFirst({
      where: {
        chainId: chainId,
      },
    });
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getLastSyncedBlockHeight = async (chainDoc: Chain) => {
  try {
    const res = await prisma.chain.findFirst({
      where: {
        chainId: chainDoc.chainId,
      },
    });
    if (res) return res.blockHeight;
    else return 1;
  } catch (error) {
    console.error(error);
    return 1;
  }
};
