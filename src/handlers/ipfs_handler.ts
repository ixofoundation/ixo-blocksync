import axios from "axios";
import { prisma } from "../prisma/prisma_client";
import { createWeb3SRateLimiter } from "../util/rate-limiter";
import { sleep } from "../util/sleep";
import { Ipfs } from "@prisma/client";

const web3SRateLimiter = createWeb3SRateLimiter();

export const getIpfsDocument = async (cid: string): Promise<Ipfs> => {
  const doc = await prisma.ipfs.findFirst({
    where: {
      cid: cid,
    },
  });
  if (doc) return doc;

  await web3SRateLimiter();
  const res = await axios.get(`https://${cid}.ipfs.cf-ipfs.com`, {
    responseType: "arraybuffer",
  });
  // const res = await axios.get(`https://ipfs.io/ipfs/${cid}`);

  if (res.status !== 200) {
    if (res.status === 429) {
      await sleep(1000);
      return await getIpfsDocument(cid);
    }

    throw new Error(`failed to get ${cid} - [${res.status}] ${res.statusText}`);
  }

  const type = res.headers["content-type"] || "";
  // We dont support html at the moment as it can be directories instead of files
  if (!type || type.includes("text/html")) {
    throw new Error(`invalid content type ${type}`);
  }

  const buffer = Buffer.from(res.data);

  return prisma.ipfs.create({
    data: {
      cid: cid,
      contentType: type,
      data: buffer.toString("base64"),
    },
  });
};
