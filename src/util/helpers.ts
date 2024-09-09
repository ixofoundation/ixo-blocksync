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

/**
 * Gets the value of the wasm event attribute with the given key
 */
export const getWasmAttr = (attributes: any[], key: string): string => {
  return attributes.find((attr) => attr.key === key)?.value || "";
};

export const base64ToJson = (base64String: string) => {
  const json = Buffer.from(base64String, "base64").toString();
  return JSON.parse(json);
};

/**
 * Cosmwasm joins all messages events into one array
 * This function splits the array, after checking if it is a sequential or alphabetical group
 * It returns a list of message event arrays, to be able to index them by action as if each group was a message
 */
export const splitAttributesByKeyValue = (array: Attribute[]) => {
  let result: Attribute[][] = [];

  // first attribute is always "_contract_address", so remove it
  // this modifies the original array, which is fine as not used again, thus this more performant
  array.splice(0, 1);

  // TODO: consider changing return of func to list of maps for performance
  // currently there is 2 ways the attributes are grouped,
  // 1-  sequentially(by action), so action then its other attributes, then action again and so on:
  // {"key": "action","value": "transfer"},
  // {"key": "amount","value": "5113774"},
  // {"key": "from","value": "ixo1ffdljtp6l6mr8f7aena8tl8u39y9epd5xgx0w4n9880ww6l8ch0s4ewrzd"},
  // {"key": "action","value": "transfer"},
  // {"key": "amount","value": "5113774"},
  // {"key": "from","value": "ixo1ffdljtp6l6mr8f7aena8tl8u39y9epd5xgx0w4n9880ww6l8ch0s4ewrzd"}

  // 2- alphabetically(by key), so all actions, then all other attributes groupd by key and alphabetically:
  // {"key": "action","value": "transfer"},
  // {"key": "action","value": "transfer"},
  // {"key": "amount","value": "530"},
  // {"key": "amount","value": "530"},
  // {"key": "from","value": "ixo1n8yrmeatsk74dw0zs95ess9sgzptd6thgjgcj2"},
  // {"key": "from","value": "ixo1n8yrmeatsk74dw0zs95ess9sgzptd6thgjgcj2"}

  // first check if first 2 attributes keys is both "action", to know if we need to group by sequentially or alphabetically
  const isSequential = array[0].key === "action" && array[1].key !== "action";

  // if sequential then group by splitting the array by action
  if (isSequential) {
    let currentGroup: Attribute[] = [];
    for (let attr of array) {
      if (attr.key === "action") {
        if (currentGroup.length > 0) result.push(currentGroup);
        currentGroup = [attr];
      } else {
        currentGroup.push(attr);
      }
    }
    if (currentGroup.length > 0) result.push(currentGroup);
  } else {
    // if not sequential then group by splitting the array into amount of 'action' attributes
    // this assumes that all attributes will be for same action type, which is safe assumption for now
    // and with this assumtion it means the amount of attirbutes will be equal per action

    // Count the number of 'action' keys
    const actionCount = array.filter((attr) => attr.key === "action").length;
    // Initialize result with empty arrays for each action group
    result = Array(actionCount).fill([]);
    // Distribute attributes across groups
    for (let i = 0; i < array.length; i++) {
      const groupIndex = i % actionCount;
      result[groupIndex].push(array[i]);
    }
  }

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
