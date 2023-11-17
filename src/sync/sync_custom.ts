import { prisma, prismaCore } from "../prisma/prisma_client";
import { sleep } from "../util/sleep";

export const startSync = async () => {
  const syncing = true;
  let index = 0;
  let pageSize = 100;
  let nextCursor: string | undefined = undefined;

  const query = async (take = 1, cursor?: string) =>
    await prisma.transaction.findMany({
      take: take,
      ...(cursor
        ? {
            cursor: { hash: cursor },
            skip: 1,
          }
        : {}),
      orderBy: {
        height: "asc",
      },
      select: {
        hash: true,
      },
    });

  while (syncing) {
    try {
      console.log("Batch Index: ", index++);
      const res = await query(pageSize, nextCursor);
      if (res.length == 0) {
        console.log("Done!!!!!!!!!!!");
        break;
      }
      nextCursor = res[res.length - 1].hash;

      for (const tx of res) {
        const txRes = await prismaCore.transactionCore.findFirst({
          where: { hash: tx.hash },
          select: { memo: true },
        });
        if (!txRes) {
          console.log("Tx not found, skipping");
          continue;
        }
        if (txRes.memo) {
          console.log("hash: ", tx.hash, " memo: ", txRes.memo);
          await prisma.transaction.update({
            where: { hash: tx.hash },
            data: {
              memo: txRes.memo,
            },
          });
        }
      }

      // wait 1 second to not overload the node
      await sleep(1000);
    } catch (error) {
      console.error(`Error Getting Transactions: ${error}`);
    }
  }
};
