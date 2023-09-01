import { Attribute, EventTypes, EventTypesAttributeKey } from "../types/Event";

export const upperHexFromUint8Array = (uint8Array: Uint8Array): string => {
  return Buffer.from(uint8Array).toString("hex").toUpperCase();
};

export const getDocFromAttributes = (
  attributes: any[],
  key: EventTypes,
  parseJson = true
) => {
  return parseJson
    ? JSON.parse(
        attributes.find((attr) => attr.key === EventTypesAttributeKey[key])
          .value
      )
    : attributes.find((attr) => attr.key === EventTypesAttributeKey[key]).value;
};

export const getValueFromAttributes = (
  attributes: any[],
  key: string,
  parseJson = true
) => {
  return parseJson
    ? JSON.parse(attributes.find((attr) => attr.key === key).value || "")
    : attributes.find((attr) => attr.key === key).value || "";
};

export const getWasmAttr = (attributes: any[], key: string): string => {
  return attributes.find((attr) => attr.key === key)?.value || "";
};

export const base64ToJson = (base64String: string) => {
  const json = Buffer.from(base64String, "base64").toString();
  return JSON.parse(json);
};

export const splitAttributesByKeyValue = (
  array: Attribute[],
  value = "action"
) => {
  const result: Attribute[][] = [];
  let currentGroup: Attribute[] = [];

  for (let obj of array.filter((attr) => attr.key !== "_contract_address")) {
    if (obj.key === value) {
      if (currentGroup.length > 0) result.push(currentGroup);
      currentGroup = [obj];
    } else {
      currentGroup.push(obj);
    }
  }
  if (currentGroup.length > 0) result.push(currentGroup);
  return result;
};

export const chunkArray = <T>(arr: T[], size: number): T[][] =>
  [...Array(Math.ceil(arr.length / size))].map((_, i) =>
    arr.slice(size * i, size + size * i)
  );

export const countTokensByType = (
  tokens = {},
  type: "amount" | "minted" | "retired"
) => Object.values(tokens).reduce((r: any, t: any) => r + (t[type] ?? 0), 0);
