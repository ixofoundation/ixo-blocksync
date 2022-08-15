import { Prisma } from "@prisma/client";
import { IEvent } from "../interface_models/Event";
import { IGNORE_EVENTS, ONLY_EVENTS } from "../../util/secrets";
import * as EventHandler from "../handlers/event_handler";

export const routeEvent = async (event: any, blockHeight: number, eventSource: string, eventIndex: [number, number], timestamp: Date) => {
    if ((ONLY_EVENTS && ONLY_EVENTS.indexOf(event.type) < 0)
        || (IGNORE_EVENTS && IGNORE_EVENTS.indexOf(event.type) >= 0)) {
        return;
    };
    let type = event.type;
    let attributes: Prisma.JsonArray = event.attributes;
    let newEvent: IEvent = {
        type: type,
        attributes: attributes,
        blockHeight: blockHeight,
        eventSource: eventSource,
        eventIndex: eventIndex,
        timestamp: timestamp,
    };
    return EventHandler.createEvent(newEvent);
}