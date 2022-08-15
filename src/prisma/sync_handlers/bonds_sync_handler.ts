import { NewBondsInfo } from "../interface_models/Bond";
import * as BondHandler from "../handlers/bonds_handler";

export const routeNewBondsInfo = async (bondsInfo: NewBondsInfo) => {
    for (let i: number = 0; i < bondsInfo.bondsInfo.length; i++) {
        const bondInfo = bondsInfo.getBondInfo(i);
        if (!bondInfo.hasMultiplePrices()) {
            await BondHandler.addPriceEntry(bondInfo);
        } else {
            await BondHandler.addInitialPriceEntry(bondInfo);
        }
    }
};