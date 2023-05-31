import { EventTypes, EventTypesAttributeKey } from "../types/Event";

export const upperHexFromUint8Array = (uint8Array: Uint8Array): string => {
  return Buffer.from(uint8Array).toString("hex").toUpperCase();
};

export const getDocFromAttributes = (attributes: any[], key: EventTypes) => {
  return JSON.parse(
    attributes.find((attr) => attr.key === EventTypesAttributeKey[key]).value
  );
};

export const base64ToJson = (base64String: string) => {
  const json = Buffer.from(base64String, "base64").toString();
  return JSON.parse(json);
};
