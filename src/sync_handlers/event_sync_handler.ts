import { ONLY_EVENTS, IGNORE_EVENTS } from "../util/secrets";
import { createEvent } from "../handlers/event_handler";

export const syncEvents = async (
    blockResult: any,
    blockHeight: number,
    timestamp: Date,
) => {
    if (blockResult.txs_results) {
        console.log(
            `Syncing Transaction Result Events for Block ${blockHeight}`,
        );
        blockResult.txs_results.forEach(async (tx: any, indexT: number) => {
            tx.events.forEach(async (event: any, indexE: number) => {
                if (
                    (ONLY_EVENTS && ONLY_EVENTS.indexOf(event.type) < 0) ||
                    (IGNORE_EVENTS && IGNORE_EVENTS.indexOf(event.type) >= 0)
                ) {
                    return;
                }
                const type = event.type;
                const attributes = event.attributes;
                await createEvent({
                    type: type,
                    attributes: attributes,
                    blockHeight: blockHeight,
                    eventSource: "deliver_tx",
                    eventIndex: [indexT, indexE],
                    timestamp: timestamp,
                });
            });
        });
    }
    if (blockResult.begin_block_events) {
        console.log(`Syncing Begin Block Events for Block ${blockHeight}`);
        blockResult.begin_block_events.forEach(
            async (event: any, index: number) => {
                const type = event.type;
                const attributes = event.attributes;
                await createEvent({
                    type: type,
                    attributes: attributes,
                    blockHeight: blockHeight,
                    eventSource: "begin_block",
                    eventIndex: [index, 0],
                    timestamp: timestamp,
                });
            },
        );
    }
    if (blockResult.end_block_events) {
        console.log(`Syncing End Block Events for Block ${blockHeight}`);
        blockResult.end_block_events.forEach(
            async (event: any, index: number) => {
                const type = event.type;
                const attributes = event.attributes;
                await createEvent({
                    type: type,
                    attributes: attributes,
                    blockHeight: blockHeight,
                    eventSource: "end_block",
                    eventIndex: [index, 0],
                    timestamp: timestamp,
                });
            },
        );
    }
};
