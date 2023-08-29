import axios from "axios";
import { prisma } from "../prisma/prisma_client";
import { web3StorageRateLimiter } from "../util/rate-limiter";
import { sleep } from "../util/sleep";
import { Ipfs } from "@prisma/client";
import axiosRetry from "axios-retry";

axiosRetry(axios, {
  retries: 3,
  retryDelay: () => 500,
});

export const getIpfsDocument = async (cid: string): Promise<Ipfs> => {
  const doc = await prisma.ipfs.findFirst({
    where: {
      cid: cid,
    },
  });
  if (doc) return doc;

  try {
    await web3StorageRateLimiter.removeTokens(1);
  } catch (error) {
    await sleep(1000);
    return await getIpfsDocument(cid);
  }

  let res;
  try {
    res = await axios.get(`https://${cid}.ipfs.cf-ipfs.com`, {
      responseType: "arraybuffer",
    });
    //  res = await axios.get(`https://ipfs.io/ipfs/${cid}`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`failed to get ${cid} - [404] Not Found`);
    }
    if (error.response && error.response.status === 429) {
      await sleep(1000);
      return await getIpfsDocument(cid);
    }
    if (error.response && error.response.status === 500) {
      throw new Error(`failed to get ${cid} - [500] Internal Server Error`);
    }
    throw new Error(`failed to get ${cid} - ${error}`);
  }

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

  return prisma.ipfs.upsert({
    where: { cid: cid },
    update: {
      contentType: type,
      data: buffer.toString("base64"),
    },
    create: {
      cid: cid,
      contentType: type,
      data: buffer.toString("base64"),
    },
  });
};
