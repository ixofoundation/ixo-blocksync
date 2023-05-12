import { prisma } from "../prisma/prisma_client";
import { createWeb3SRateLimiter } from "../util/rate-limiter";
import { sleep } from "../util/sleep";

const web3SRateLimiter = createWeb3SRateLimiter();

export const getIpfsDocument = async (cid: string) => {
  const doc = await prisma.ipfs.findFirst({
    where: {
      cid: cid,
    },
  });
  if (doc) return doc;

  await web3SRateLimiter();
  const res = await fetch(`https://${cid}.ipfs.cf-ipfs.com`, {
    method: "GET",
  });
  // const res = await axios.get(`https://ipfs.io/ipfs/${cid}`);

  if (res.status !== 200) {
    if (res.status === 429) {
      await sleep(1000);
      return await getIpfsDocument(cid);
    }

    throw new Error(`failed to get ${cid} - [${res.status}] ${res.statusText}`);
  }

  const type = res.headers.get("content-type") || "";
  // We dont support html at the moment as it can be directories instead of files
  if (!type || type.includes("text/html")) {
    throw new Error(`invalid content type ${type}`);
  }

  const blob = await res.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  // below is web3 storage code
  // const res = await client.get(cid);
  // if (!res?.ok) {
  //   throw new Error(
  //     `failed to get ${cid} - [${res?.status}] ${res?.statusText}`
  //   );
  // }
  // // unpack File objects from the response
  // const files = await res.files();
  // if (files.length > 1) {
  //   throw new Error(
  //     `only support single file ipfs uploads, not wrap with directory uploads`
  //   );
  // }
  // if (files.length === 0) {
  //   throw new Error(`no files found in ${cid}`);
  // }
  // const file = files[0];
  // if (file.name !== cid) {
  //   throw new Error(
  //     `only support single file ipfs uploads, not wrap with directory uploads`
  //   );
  // }
  // const resStatus = await client.status(file.cid);
  // if (!resStatus?.cid) {
  //   throw new Error(
  //     `failed to get status for ${cid} - [${res?.status}] ${res?.statusText}`
  //   );
  // }

  return prisma.ipfs.create({
    data: {
      cid: cid,
      contentType: type,
      data: buffer.toString("base64"),
    },
  });
};
