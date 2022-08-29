import axios from "axios";
import axiosRetry from "axios-retry";

axiosRetry(axios, { retries: 3 });

export const getSignData = async (msgHex: string, pubKey: string) => {
    const rest = (process.env.BC_REST || 'http://localhost:1317');
    return axios.post(rest + '/txs/sign_data', { msg: msgHex, pub_key: pubKey });
};

export const decodeTx = async (txData: string) => {
    const rest = (process.env.BC_REST || 'localhost:1317');
    const response = await axios.post(rest + '/txs/decode', { tx: txData });
    if (response.status == 200) {
        return response;
    } else {
        console.log(response.statusText);
        return;
    };
};