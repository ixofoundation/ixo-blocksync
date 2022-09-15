export enum WasmMsgTypes {
    storeCode = "wasm/MsgStoreCode",
    instantiateContract = "wasm/MsgInstantiateContract",
    migrateContract = "wasm/MsgMigrateContract",
    clearAdmin = "wasm/MsgClearAdmin",
    updateAdmin = "wasm/MsgUpdateAdmin",
    executeContract = "wasm/MsgExecuteContract",
}
