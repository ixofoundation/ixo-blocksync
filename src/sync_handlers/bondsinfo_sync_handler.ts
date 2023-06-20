import { QueryBondsDetailedResponse } from "@ixo/impactxclient-sdk/types/codegen/ixo/bonds/v1beta1/query";
import { Prisma } from "@prisma/client";
import * as BondHandler from "../handlers/bond_handler";
import { prisma } from "../prisma/prisma_client";

export const syncBondsInfo = async (
  bondsInfo: QueryBondsDetailedResponse,
  timestamp: Date
) => {
  if (!bondsInfo.bondsDetailed?.length) return;

  const bonds = await prisma.bond.findMany({
    where: {
      bondDid: { in: bondsInfo.bondsDetailed.map((bond) => bond.bondDid) },
    },
  });

  await Promise.all(
    bondsInfo.bondsDetailed.map(async (bond) => {
      try {
        // const bondExists = await BondHandler.listBondByBondDid(bond.bondDid);
        // if (bondExists) {
        if (bonds?.find((b) => b?.bondDid === bond.bondDid)) {
          const amount = new Prisma.Decimal(bond.spotPrice[0].amount);
          const denom = bond.spotPrice[0].denom;
          const lastPrice = await BondHandler.getLastPrice(bond.bondDid);

          if (lastPrice) {
            if (!lastPrice.price.equals(amount)) {
              await BondHandler.createPriceEntry({
                bondDid: bond.bondDid,
                time: timestamp,
                denom: denom,
                price: amount,
              });
            }
          } else {
            await BondHandler.createPriceEntry({
              bondDid: bond.bondDid,
              time: timestamp,
              denom: denom,
              price: amount,
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    })
  );
};
