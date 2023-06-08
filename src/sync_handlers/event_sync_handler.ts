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
  // First index begin block events
  for (const event of beginBlockEvents) {
    try {
      const eventDoc = decodeEvent(event);

      if (EventTypesArray.includes(eventDoc.type)) {
        await syncEventData(eventDoc);
        await createEvent({
          type: eventDoc.type,
          attributes: eventDoc.attributes,
          blockHeight: blockHeight,
          timestamp: timestamp,
        });
      } else if (eventDoc.type === "wasm") {
        await syncWasmEventData(eventDoc);
        await createEvent({
          type: eventDoc.type,
          attributes: eventDoc.attributes,
          blockHeight: blockHeight,
          timestamp: timestamp,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  // then index tx events
  if (txEvents.length)
    console.log(`Syncing tx Events for Block ${blockHeight}`);

  for (const event of txEvents) {
    try {
      const eventDoc = decodeEvent(event);

      if (EventTypesArray.includes(eventDoc.type)) {
        await syncEventData(eventDoc);
        await createEvent({
          type: eventDoc.type,
          attributes: eventDoc.attributes,
          blockHeight: blockHeight,
          timestamp: timestamp,
        });
      } else if (eventDoc.type === "wasm") {
        await syncWasmEventData(eventDoc);
        await createEvent({
          type: eventDoc.type,
          attributes: eventDoc.attributes,
          blockHeight: blockHeight,
          timestamp: timestamp,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  // lastly index end block events
  for (const event of endBlockEvents) {
    try {
      const eventDoc = decodeEvent(event);

      if (EventTypesArray.includes(eventDoc.type)) {
        await syncEventData(eventDoc);
        await createEvent({
          type: eventDoc.type,
          attributes: eventDoc.attributes,
          blockHeight: blockHeight,
          timestamp: timestamp,
        });
      } else if (eventDoc.type === "wasm") {
        await syncWasmEventData(eventDoc);
        await createEvent({
          type: eventDoc.type,
          attributes: eventDoc.attributes,
          blockHeight: blockHeight,
          timestamp: timestamp,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }
};
