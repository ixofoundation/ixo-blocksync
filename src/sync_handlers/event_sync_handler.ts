import { Event } from "@ixo/impactxclient-sdk/types/codegen/tendermint/abci/types";
import { createEvent } from "../handlers/event_handler";
import { EventTypesArray } from "../types/Event";
import { decodeEvent } from "../util/proto";
import { syncEventData } from "./event_data_sync_handler";

export const syncEvents = async (
  events: Event[],
  blockHeight: number,
  timestamp: Date
) => {
  if (events.length === 0) return;

  console.log(`Syncing Events for Block ${blockHeight}`);

  for (const event of events) {
    try {
      const eventDoc = decodeEvent(event);

      if (EventTypesArray.includes(eventDoc.type))
        await syncEventData(eventDoc);

      await createEvent({
        type: eventDoc.type,
        attributes: eventDoc.attributes,
        blockHeight: blockHeight,
        timestamp: timestamp,
      });
    } catch (error) {
      console.error(error);
    }
  }
};
