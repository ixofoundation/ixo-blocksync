import { createQueryClient, createRegistry } from "@ixo/impactxclient-sdk";
import Long from "long";
import { RPC } from "./secrets";

enum OrderBy {
    ORDER_BY_UNSPECIFIED = 0,
    ORDER_BY_ASC = 1,
    ORDER_BY_DESC = 2,
    UNRECOGNIZED = -1,
}

export interface Timestamp {
    seconds: Long;
    nanos: number;
}

interface EventAttribute {
    key: Uint8Array;
    value: Uint8Array;
    index: boolean;
}

export interface Event {
    type: string;
    attributes: EventAttribute[];
}

export const getBlockbyHeight = async (height: number | string) => {
    try {
        const client = await createQueryClient(RPC);
        const res =
            await client.cosmos.base.tendermint.v1beta1.getBlockByHeight({
                height: Long.fromNumber(Number(height)),
            });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getLatestBlock = async () => {
    try {
        const client = await createQueryClient(RPC);
        const res =
            await client.cosmos.base.tendermint.v1beta1.getLatestBlock();
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getTxsEvent = async (height: number) => {
    try {
        const client = await createQueryClient(RPC);
        const res = await client.cosmos.tx.v1beta1.getTxsEvent({
            events: [`tx.height=${String(height)}`],
            orderBy: OrderBy.ORDER_BY_ASC,
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getBondsInfo = async (height: number) => {
    try {
        const client = await createQueryClient(RPC);
        const res = await client.ixo.bonds.v1beta1.bondsDetailed(
            // {height: Long.fromNumber(Number(height))}
            "1686753",
        );
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const decode = async (tx: any) => {
    const registry = createRegistry();
    //@ts-ignore
    return registry.decode(tx);
};

function Utf8ArrayToStr(array: Uint8Array) {
    let out, i, c;
    let char2, char3;

    out = "";
    const len = array.length;
    i = 0;
    while (i < len) {
        c = array[i++];
        switch (c >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12:
            case 13:
                // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(
                    ((c & 0x0f) << 12) |
                        ((char2 & 0x3f) << 6) |
                        ((char3 & 0x3f) << 0),
                );
                break;
        }
    }

    return out;
}

export function Uint8ArrayToJS(data: Uint8Array): string {
    const decodedData = Utf8ArrayToStr(data);
    return decodedData;
}

export const getTimestamp = (time: Timestamp) => {
    return new Date(Number(time.seconds) * 1000 + Number(time.nanos) / 1000000);
};

export const getEvent = (event: Event) => {
    const attributes: any[] = [];
    event.attributes.forEach(async (attr) => {
        attributes.push({
            key: Uint8ArrayToJS(attr.key),
            value: Uint8ArrayToJS(attr.value),
            index: attr.index,
        });
    });
    return {
        type: event.type,
        attributes: attributes,
    };
};
