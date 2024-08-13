// @ts-nocheck
import Long from "long";

// add toJSON method to Long prototype since prisma uses JSONProtocol for serialization and deserialization
// and Long does not have a toJSON method, please use this with caution as it may have unintended consequences

if (!Long.prototype.toJSON) {
  Long.prototype.toJSON = function () {
    // return as object with low and high and unsigned properties
    return {
      low: this.low,
      high: this.high,
      unsigned: this.unsigned,
    };
  };
}
