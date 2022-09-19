import axios from "axios";
import axiosRetry from "axios-retry";
import * as Secrets from "./secrets";

axiosRetry(axios, { retries: 3 });

export const testConnection = async () => {
    try {
        await testRpcConnection();
        await testRestConnection();
    } catch (error) {
        console.log(error);
    }
};

export const getBlock = async (height: number | string) => {
    try {
        const res = await axios.get(Secrets.RPC + "/block?height=" + height);
        return res.data.result.block;
    } catch (error) {
        console.log(error);
    }
};

export const getLastBlock = async () => {
    return getBlock("");
};

export const getBlockHash = async (height: number) => {
    const res = await getBlock(height + 1);
    return res.header.last_block_id.hash;
};

export const getBlockResult = async (height: number | string) => {
    try {
        const res = await axios.get(
            Secrets.RPC + "/block_results?height=" + height,
        );
        return res.data.result;
    } catch (error) {
        console.log(error);
    }
};

export const decodeTx = async (txData: string) => {
    try {
        const res = await axios.post(Secrets.REST + "/txs/decode", {
            tx: txData,
        });
        return res.data.result;
    } catch (error) {
        console.log(error);
    }
};

export const sendTransaction = async (txData: any) => {
    try {
        const res = await axios.post(Secrets.REST + "/txs", txData);
        if (res.data.error) return res.data.error;
        else return res.data;
    } catch (error) {
        console.log(error);
    }
};

export const getBondsInfo = async (height: number) => {
    if (
        !Secrets.BONDS_INFO_EXTRACT_PERIOD_BLOCKS ||
        height % Secrets.BONDS_INFO_EXTRACT_PERIOD_BLOCKS
    ) {
        return "";
    }
    const res = await axios.get(
        Secrets.REST + "/bonds_detailed?height=" + height,
    );
    if (res.data) return res.data;
    else return {};
};

const testRpcConnection = async () => {
    const res = await axios.get(Secrets.RPC + "/health");
    console.log(res);
};

const testRestConnection = async () => {
    const res = await axios.get(Secrets.REST + "/node_info");
    console.log(res);
};
