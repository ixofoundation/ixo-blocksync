import { createEvent } from "../handlers/event_handler";
import { Event, getEvent } from "../util/proto";

export const syncEvents = async (
    events: Event[],
    blockHeight: number,
    timestamp: Date,
) => {
    if (events) {
        console.log(
            `Syncing Transaction Result Events for Block ${blockHeight}`,
        );
        events.forEach(async (event) => {
            const eventDoc = getEvent(event);
            await createEvent({
                type: eventDoc.type,
                attributes: eventDoc.attributes,
                blockHeight: blockHeight,
                timestamp: timestamp,
            });
        });
    }
};
