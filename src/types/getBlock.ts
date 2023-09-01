import { getBlock } from "../sync/sync_blocks";
import { ArrElement } from "./General";

export type GetBlockType = NonNullable<Awaited<ReturnType<typeof getBlock>>>;
export type GetTransactionsType = GetBlockType["transactions"];
export type GetEventsType = GetBlockType["events"];
export type GetEventType = ArrElement<GetEventsType>;
