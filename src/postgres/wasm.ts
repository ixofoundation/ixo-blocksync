import { dbQuery } from "./client";

// =============================================
// Wasm Instantiate Operations
// =============================================

export type WasmInstantiate = {
  address: string;
  code_id: number;
  created_at: Date;
  block_height: number;
  msg_index: number | null;
};

const createWasmInstantiateSql = `
INSERT INTO wasm_instantiate (
  address, code_id, created_at, block_height, msg_index
) VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (address) DO NOTHING;
`;

export const createWasmInstantiate = async (
  data: WasmInstantiate
): Promise<void> => {
  await dbQuery(createWasmInstantiateSql, [
    data.address,
    data.code_id,
    data.created_at,
    data.block_height,
    data.msg_index,
  ]);
};
