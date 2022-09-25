import { Prisma } from "@prisma/client";
import * as BondHandler from "../handlers/bond_handler";

export const syncBondsInfo = async (bondsInfo: any, timestamp: Date) => {
    bondsInfo.forEach(async (info: any) => {
        const amount = new Prisma.Decimal(info.spot_price[0].amount);
        const bondExists = await BondHandler.listBondByBondDid(info.did);
        if (bondExists !== null) {
            const lastPrice = await BondHandler.getLastPrice(info.did);
            if (lastPrice !== null && lastPrice !== undefined) {
                if (lastPrice.price.equals(amount)) {
                    await BondHandler.createPriceEntry({
                        bondDid: info.did,
                        time: timestamp,
                        denom: info.spot_price[0].denom,
                        price: amount,
                    });
                }
            } else {
                await BondHandler.createPriceEntry({
                    bondDid: info.did,
                    time: timestamp,
                    denom: info.spot_price[0].denom,
                    price: amount,
                });
            }
        }
    });
};
