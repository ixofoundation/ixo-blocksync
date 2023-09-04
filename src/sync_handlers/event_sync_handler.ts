import { GetEventsType } from "../types/getBlock";
import { syncEventData } from "./event_data_sync_handler";
import { syncWasmEventData } from "./event_data_sync_wasm_handler";

export const syncEvents = async (
  events: GetEventsType,
  blockHeight: number,
  timestamp: Date
) => {
  let delayedFunction: any = null;
  let i = 0;
  for (const event of events) {
    if (i === 0) {
      console.log(`Syncing Events for Block ${blockHeight}`);
      i++;
    }

    let res: any = null;
    try {
      if (event.type === "wasm") {
        res = await syncWasmEventData(event);
      } else {
        await syncEventData(event, blockHeight, timestamp);
      }
      // run delayed function after syncEventData if skip value 1
      if (
        delayedFunction &&
        delayedFunction.skip === 1 &&
        delayedFunction.func instanceof Function
      ) {
        await delayedFunction.func();
      }
    } catch (error) {
      console.error("syncEvent: ", error.message);
    } finally {
      // if delayedFunction is not null and skip value is not 1, then minus current skip value by 1
      // NOTE: this means if there is current delayedFunction, then a new one cant be set until the current one is run
      // which theoretically should never happen
      if (delayedFunction && delayedFunction.skip !== 1) {
        delayedFunction.skip--;
      } else {
        delayedFunction = res;
      }
    }
  }
};
