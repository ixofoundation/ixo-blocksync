import { parseJson, prisma } from "../prisma/prisma_client";

export const getIidByIid = async (id: string) => {
  const iid = await prisma.iID.findFirst({
    where: {
      id: id,
    },
  });
  iid!.verificationMethod = parseJson(iid!.verificationMethod);
  iid!.metadata = parseJson(iid!.metadata);
  return iid;
};
