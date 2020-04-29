import {EventSyncHandler} from "./event_sync_handler";
import {IEvent} from "../models/event";
import {IGNORE_EVENTS, ONLY_EVENTS} from "../util/secrets";

export class EventHandler {
  private eventSyncHandler = new EventSyncHandler();

  routeEvent(event: any, blockHeight: number, eventSource: string, eventIndex: string) {

    if ((ONLY_EVENTS && ONLY_EVENTS.indexOf(event.type) < 0)
      || (IGNORE_EVENTS && IGNORE_EVENTS.indexOf(event.type) >= 0)) {
      return;
    }

    // console.log('routeEvent::: Found ' + JSON.stringify(event));
    let eventType = event.type;
    let eventAttributes = event.attributes;

    for (let i: number = 0; i < eventAttributes.length; i++) {
      eventAttributes[i].key = eventAttributes[i].key ? Buffer.from(eventAttributes[i].key, 'base64').toString() : "";
      eventAttributes[i].value = eventAttributes[i].value ? Buffer.from(eventAttributes[i].value, 'base64').toString() : "";
    }

    let toCreate: IEvent = {
      type: eventType,
      attributes: eventAttributes,
      context: {
        blockHeight: blockHeight,
        eventSource: eventSource,
        eventIndex: eventIndex,
      }
    };
    return this.eventSyncHandler.create(toCreate);
  }
}
