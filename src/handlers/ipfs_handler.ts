import axios from "axios";
import { web3StorageRateLimiter } from "../util/rate-limiter";
import { sleep } from "../util/sleep";
import axiosRetry from "axios-retry";

axiosRetry(axios, {
  retries: 3,
  retryDelay: () => 500,
});

export const getIpfsDocument = async (cid: string) => {
  try {
    await web3StorageRateLimiter.removeTokens(1);
  } catch (error) {
    await sleep(1000);
    return await getIpfsDocument(cid);
  }

  let res;
  try {
    res = await axios.get(`https://ipfs.gateway.ixo.world/ipfs/${cid}`, {
      responseType: "arraybuffer",
    });
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
    return { error: "invalid content type" };
  }

  return {
    cid: cid,
    contentType: type,
    data: res.data,
  };
};
