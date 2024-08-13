import { pool } from "./client";

export type Ipfs = {
  cid: string;
  contentType: string;
  data: string;
};

const getIpfsSql = `
SELECT * FROM "Ipfs" WHERE "cid" = $1;
`;
export const getIpfs = async (cid: string): Promise<Ipfs | undefined> => {
  try {
    const res = await pool.query(getIpfsSql, [cid]);
    return res.rows[0];
  } catch (error) {
    throw error;
  }
};

const upsertIpfsSql = `
INSERT INTO "public"."Ipfs" ( "cid", "contentType", "data") 
VALUES ( $1, $2, $3 )
ON CONFLICT("cid") DO UPDATE SET
  "contentType" = EXCLUDED."contentType",
  "data" = EXCLUDED."data"
WHERE "Ipfs"."cid" = EXCLUDED."cid";
`;
export const upsertIpfs = async (p: Ipfs): Promise<void> => {
  try {
    await pool.query(upsertIpfsSql, [p.cid, p.contentType, p.data]);
  } catch (error) {
    throw error;
  }
};
