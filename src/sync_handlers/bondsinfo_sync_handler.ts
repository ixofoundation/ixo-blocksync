import { Decimal } from "@prisma/client/runtime";
import * as BondHandler from "../handlers/bond_handler";

export const syncBondsInfo = async (bondsInfo: any, timestamp: Date) => {
    bondsInfo.forEach(async (info: any) => {
        const bondExists = await BondHandler.listBondByBondDid(info.did);
        if (bondExists) {
            const lastPrice = await BondHandler.getLastPrice(info.did);
            if (lastPrice) {
                if (
                    lastPrice.price !== new Decimal(info.spot_price[0].amount)
                ) {
                    await BondHandler.createPriceEntry({
                        bondDid: info.did,
                        time: timestamp,
                        denom: info.spot_price[0].denom,
                        price: new Decimal(info.spot_price[0].amount),
                    });
                }
            } else {
                await BondHandler.createPriceEntry({
                    bondDid: info.did,
                    time: timestamp,
                    denom: info.spot_price[0].denom,
                    price: new Decimal(info.spot_price[0].amount),
                });
            }
        }
    });
};
