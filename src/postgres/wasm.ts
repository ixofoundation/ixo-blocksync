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

// Called on wasm "migrate" events (MsgMigrateContract) — the contract keeps
// its address but runs new code, so re-point the stored code_id used for
// code-id-based classification. If the address was never indexed the UPDATE
// matches zero rows and this is a no-op by design.
const updateWasmContractCodeIdSql = `
UPDATE wasm_instantiate SET code_id = $2 WHERE address = $1;
`;

export const updateWasmContractCodeId = async (
  address: string,
  codeId: number
): Promise<void> => {
  await dbQuery(updateWasmContractCodeIdSql, [address, codeId]);
};
