export const jsonToBase64 = (json: any) => {
  return Buffer.from(JSON.stringify(json)).toString("base64");
};
