import { BlockCore } from "../postgres/blocksync_core/block";
import { syncEventData } from "./event_data_sync";
import { syncWasmEventData } from "./event_data_sync_wasm";

export type DelayedFunction = {
  skip: number;
  func: () => Promise<void>;
};

export const syncEvents = async (block: BlockCore) => {
  let delayedFunction: DelayedFunction | null = null;

  // if (events.length > 0) console.log(`Syncing Events for Block ${blockHeight}`);

  for (const event of block.events) {
    let res: any = null;
    try {
      if (
        event.type === "wasm" ||
        event.type === "instantiate" ||
        event.type === "migrate"
      ) {
        res = await syncWasmEventData(event, block);
      } else {
        await syncEventData(event, block);
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
      // Note: if error is thrown here and there is a delayedFunction, then that delayedFunction will not be run and
      // and will be lost. Need to fix this. Logging for now so we can see if there was a delayedFunction.
      console.error("ERROR::syncEvent:: ", error.message);
      if (delayedFunction?.skip || res?.skip) {
        console.log("delayedFunction", delayedFunction);
        console.log("res", res);
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.log(
          "There was an error in syncEvents, but there was a delayedFunction, so the delayedFunction will not be run and will be lost. Need to re-index Blocksync!!"
        );
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      }
      throw error;
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
