import { Event } from "@cosmjs/tendermint-rpc/build/tendermint34/responses";
import { createEvent } from "../handlers/event_handler";
import { EventTypesArray } from "../types/Event";
import { decodeEvent } from "../util/proto";
import { syncEventData } from "./event_data_sync_handler";
import { syncWasmEventData } from "./event_data_sync_wasm_handler";

export const syncEvents = async (
  beginBlockEvents: Event[],
  txEvents: Event[],
  endBlockEvents: Event[],
  blockHeight: number,
  timestamp: Date
) => {
  let i = 0;
  // First index begin block events, then tx events, then end block events
  for (const event of beginBlockEvents.concat(txEvents, endBlockEvents)) {
    try {
      if (EventTypesArray.includes(event.type)) {
        if (i === 0) {
          console.log(`Syncing Events for Block ${blockHeight}`);
          i++;
        }
        const eventDoc = decodeEvent(event);
        await syncEventData(eventDoc, blockHeight, timestamp);
        await createEvent({
          type: eventDoc.type,
          attributes: eventDoc.attributes,
          blockHeight: blockHeight,
          timestamp: timestamp,
        });
      } else if (event.type === "wasm") {
        if (i === 0) {
          console.log(`Syncing Events for Block ${blockHeight}`);
          i++;
        }
        const eventDoc = decodeEvent(event);
        await syncWasmEventData(eventDoc);
        await createEvent({
          type: eventDoc.type,
          attributes: eventDoc.attributes,
          blockHeight: blockHeight,
          timestamp: timestamp,
        });
      }
    } catch (error) {
      console.error(error.message);
    }
  }
};
