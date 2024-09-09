import { EventCore } from "../postgres/blocksync_core/block";
import { syncEventData } from "./event_data_sync_handler";
import { syncWasmEventData } from "./event_data_sync_wasm_handler";

export type DelayedFunction = {
  skip: number;
  func: () => Promise<void>;
};

export const syncEvents = async (
  events: EventCore[],
  blockHeight: number,
  timestamp: Date
) => {
  let delayedFunction: DelayedFunction | null = null;

  // if (events.length > 0) console.log(`Syncing Events for Block ${blockHeight}`);

  for (const event of events) {
    let res: any = null;
    try {
      if (event.type === "wasm") {
        res = await syncWasmEventData(event, timestamp);
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
      console.error("ERROR::syncEvent:: ", error.message);
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
