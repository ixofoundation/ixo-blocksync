import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";

export const createWasmCode = async (codeDoc: Prisma.WasmCodeCreateInput) => {
    try {
        const res = await prisma.wasmCode.create({ data: codeDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createWasmContract = async (
    contractDoc: Prisma.WasmContractCreateInput,
) => {
    try {
        const res = await prisma.wasmContract.create({ data: contractDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateWasmContractCodeId = async (
    address: string,
    code_id: number,
) => {
    try {
        const res = await prisma.wasmContract.update({
            where: { address: address },
            data: { code_id: code_id },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateWasmContractAdmin = async (
    address: string,
    admin: string,
) => {
    try {
        const res = await prisma.wasmContract.update({
            where: { address: address },
            data: { admin: admin },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createExecMsg = async (
    execDoc: Prisma.ExecMsgUncheckedCreateInput,
) => {
    try {
        const res = await prisma.execMsg.create({ data: execDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};
