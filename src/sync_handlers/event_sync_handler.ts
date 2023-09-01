import { GetEventsType } from "../types/getBlock";
import { syncEventData } from "./event_data_sync_handler";
import { syncWasmEventData } from "./event_data_sync_wasm_handler";

export const syncEvents = async (
  events: GetEventsType,
  blockHeight: number,
  timestamp: Date
) => {
  let i = 0;
  for (const event of events) {
    if (i === 0) {
      console.log(`Syncing Events for Block ${blockHeight}`);
      i++;
    }

    try {
      if (event.type === "wasm") await syncWasmEventData(event);
      else await syncEventData(event, blockHeight, timestamp);
    } catch (error) {
      console.error("syncEvent: ", error.message);
    }
  }
};
