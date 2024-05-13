export type MemoryUsage = {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
  arrayBuffers: string;
};

export const byteSizePretty = function (bytes: number) {
  if (bytes === 0) {
    return "0.00 B";
  }

  let e = Math.floor(Math.log(bytes) / Math.log(1024));
  return (
    (bytes / Math.pow(1024, e)).toFixed(2) + " " + " KMGTP".charAt(e) + "B"
  );
};

export const bytesSizesPretty = (bytesObject: any) => {
  return Object.keys(bytesObject).reduce((acc, key) => {
    acc[key] = byteSizePretty(bytesObject[key]);
    return acc;
  }, {}) as MemoryUsage;
};

export const getMemoryUsage = () => {
  return bytesSizesPretty(process.memoryUsage());
};
