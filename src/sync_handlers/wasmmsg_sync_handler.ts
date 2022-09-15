import { WasmMsgTypes } from "../prisma/interface_models/WasmMsg";
import * as ExecHandler from "../handlers/exec_handler";
import * as WasmHandler from "../handlers/wasm_handler";

export const SyncWasmMsg = async (transaction: any) => {
    switch (transaction.msg[0].type) {
        case WasmMsgTypes.storeCode:
            await handleStoreCode(transaction);
        case WasmMsgTypes.instantiateContract:
            await handleInstantiateContract(transaction);
        case WasmMsgTypes.migrateContract:
            await handleMigrateContract(transaction);
        case WasmMsgTypes.clearAdmin:
            await handleClearAdmin(transaction);
        case WasmMsgTypes.updateAdmin:
            await handleUpdateAdmin(transaction);
        case WasmMsgTypes.executeContract:
            await handleExecuteContract(transaction);
    }
};

const handleStoreCode = async (transaction: any) => {};

const handleInstantiateContract = async (transaction: any) => {};

const handleExecuteContract = async (transaction: any) => {};

const handleMigrateContract = async (transaction: any) => {
    return WasmHandler.updateWasmContractCodeId(
        transaction.contract,
        transaction.codeid,
    );
};

const handleClearAdmin = async (transaction: any) => {
    return WasmHandler.updateWasmContractAdmin(transaction.Contract, "");
};

const handleUpdateAdmin = async (transaction: any) => {
    return WasmHandler.updateWasmContractAdmin(
        transaction.contract,
        transaction.newadmin,
    );
};
