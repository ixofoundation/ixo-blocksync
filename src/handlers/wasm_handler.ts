import { WasmCode, WasmContract } from "@prisma/client";
import { prisma } from "../prisma/prisma_client";

export const createWasmCode = async (codeDoc: WasmCode) => {
    try {
        const res = await prisma.wasmCode.create({ data: codeDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createWasmContract = async (contractDoc: WasmContract) => {
    try {
        const res = await prisma.wasmContract.create({
            data: {
                address: contractDoc.address,
                code_id: contractDoc.code_id,
                creator: contractDoc.creator,
                admin: contractDoc.admin,
                label: contractDoc.label,
                creation_time: contractDoc.creation_time,
                height: contractDoc.height,
                json: contractDoc.json ? contractDoc.json : {},
            }
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateWasmContractCodeId = async (address: string, code_id: number) => {
    try {
        const res = await prisma.wasmContract.update({
            where: { address: address },
            data: { code_id: code_id }
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateWasmContractAdmin = async (address: string, admin: string) => {
    try {
        const res = await prisma.wasmContract.update({
            where: { address: address },
            data: { admin: admin }
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};