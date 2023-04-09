import { parseJson, prisma } from "../prisma/prisma_client";

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

export const getIidByIid = async (id: string) => {
  const iid = await prisma.iID.findFirst({
    where: {
      OR: [
        { id: prefixes[0] + id },
        { id: prefixes[1] + id },
        { id: prefixes[2] + id },
      ],
    },
  });
  iid!.verificationMethod = parseJson(iid!.verificationMethod);
  iid!.metadata = parseJson(iid!.metadata);
  return iid;
};

export const getDidByDid = async (did: string) => {
  const iid = await prisma.iID.findFirst({ where: { id: did } });
  return { did: iid?.id, publicKey: iid?.publicKey };
};
