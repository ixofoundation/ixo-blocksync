import { QueryBondsDetailedResponse } from "@ixo/impactxclient-sdk/types/codegen/ixo/bonds/v1beta1/query";
import { Prisma } from "@prisma/client";
import * as BondHandler from "../handlers/bond_handler";

export const syncBondsInfo = async (
    bondsInfo: QueryBondsDetailedResponse,
    timestamp: Date,
) => {
    for (const bond of bondsInfo.bondsDetailed) {
        try {
            const amount = new Prisma.Decimal(bond.spotPrice[0].amount);
            const denom = bond.spotPrice[0].denom;
            const bondExists = await BondHandler.listBondByBondDid(
                bond.bondDid,
            );
            if (bondExists !== null) {
                const lastPrice = await BondHandler.getLastPrice(bond.bondDid);
                if (lastPrice !== null && lastPrice !== undefined) {
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
            console.log(error);
        }
    }
};
