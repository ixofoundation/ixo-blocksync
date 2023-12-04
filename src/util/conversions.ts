import { toBase64 } from "@cosmjs/encoding";

export const b64toUint8Array = function (b64: string) {
  return Uint8Array.from(Buffer.from(b64, "base64"));
};

export const b64toJson = function (b64: string) {
  return JSON.parse(Buffer.from(b64, "base64").toString());
};

export const Uint8ArrayTob64 = function (u8: Uint8Array) {
  var b64 = Buffer.from(u8).toString("base64");
  return b64;
};

// JSON to Uint8Array parsing and visa versa
export const JsonToArray = function (json: string) {
  return new Uint8Array(Buffer.from(json));
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
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }

  return out;
}
// Converts A Unit8Array to String
export function Uint8ArrayToJS(data: Uint8Array): string {
  const decodedData = Utf8ArrayToStr(data);
  return decodedData;
}

export const concatArrayBuffers = (...bufs: Uint8Array[]) => {
  const result = new Uint8Array(
    bufs.reduce((totalSize, buf) => totalSize + buf.byteLength, 0)
  );
  bufs.reduce((offset, buf) => {
    result.set(buf, offset);
    return offset + buf.byteLength;
  }, 0);
  return result;
};

export const jsonStringToBase64 = (jsonString: string) => {
  const base64 = toBase64(JsonToArray(jsonString));
  return base64;
};

export const jsonToBase64 = (json: unknown) => {
  const jsonString = JSON.stringify(json);
  return jsonStringToBase64(jsonString);
};
