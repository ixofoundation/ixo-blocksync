import { NewBondsInfo } from "../prisma/interface_models/Bond";
import * as BondHandler from "../handlers/bonds_handler";
import { Queue, Worker } from "bullmq";

const connection = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
};

const queue = new Queue("PriceEntries", { connection: { connection } });

const worker = new Worker("PriceEntries", async (job) => {
    for (let i: number = 0; i < job.data.bondsInfo.length; i++) {
        const bondInfo = job.data.getBondInfo(i);
        if (!bondInfo.hasMultiplePrices()) {
            await BondHandler.addPriceEntry(bondInfo);
        };
        // if (bondInfo.hasMultiplePrices()) {
        //     await BondHandler.addInitialPriceEntry(bondInfo);
        // };
    };
},
    { connection: { connection } }
);

export const routeNewBondsInfo = async (bondsInfo: NewBondsInfo) => {
    const job = await queue.add("PriceEntries", bondsInfo);
};