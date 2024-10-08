import axios from "axios";
import { web3StorageRateLimiter } from "../util/rate-limiter";
import { sleep } from "../util/sleep";
import axiosRetry from "axios-retry";
import { getIpfs, Ipfs, upsertIpfs } from "../postgres/ipfs";

axiosRetry(axios, {
  retries: 3,
  retryDelay: () => 500,
});

export const getIpfsDocument = async (cid: string): Promise<Ipfs> => {
  const doc = await getIpfs(cid);
  if (doc) return doc;

  try {
    await web3StorageRateLimiter.removeTokens(1);
  } catch (error) {
    await sleep(1000);
    return await getIpfsDocument(cid);
  }

  let res;
  try {
    res = await axios.get(`https://${cid}.ipfs.w3s.link`, {
      responseType: "arraybuffer",
    });
    //  res = await axios.get(`https://ipfs.io/ipfs/${cid}`);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      await sleep(1000);
      return await getIpfsDocument(cid);
    }
    if (error.response) {
      throw new Error(
        `failed to get ${cid} - [${error.response.status}] ${error.response.statusText}`
      );
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

  await upsertIpfs({
    cid: cid,
    contentType: type,
    data: buffer.toString("base64"),
  });

  return {
    cid: cid,
    contentType: type,
    data: buffer.toString("base64"),
  };
};
