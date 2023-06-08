import { prisma } from "../prisma/prisma_client";

export const getLatestTransactions = async (
  address: string,
  take?: string,
  cursor?: string,
  denom?: string,
  type?: string,
  tokenName?: string
) => {
  const typeUrls = Array.isArray(type) ? type : type ? [type] : [];
  const query = async (take?: string, cursor?: string) =>
    await prisma.message.findMany({
      take: take ? Number(take) : 20,
      ...(cursor && {
        cursor: { id: Number(cursor) },
        skip: 1,
      }),
      where: {
        AND: [
          {
            OR: [{ from: address }, { to: address }],
          },
          {
            OR: typeUrls.map((t) => ({
              typeUrl: t,
            })) as any[],
          },
        ],
        Transaction: {
          code: 0,
        },
        ...(denom && { denoms: { has: denom } }),
        ...(tokenName && { tokenNames: { has: tokenName } }),
      },
      orderBy: {
        id: "desc",
      },
      include: {
        Transaction: true,
      },
    });

  const res = await query(take, cursor);
  if (res.length == 0) {
    return {
      data: [],
      metaData: {
        cursor: null,
        hasNextPage: false,
      },
    };
  }
  const nextCursor: any = res[res.length - 1].id;
  const nextPage = await query("1", nextCursor);
  return {
    data: res,
    metaData: {
      cursor: nextCursor,
      hasNextPage: nextPage.length > 0,
    },
  };
};
