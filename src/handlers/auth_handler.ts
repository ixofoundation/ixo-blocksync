import axios from "axios";
import axiosRetry from "axios-retry";
import { REST } from "../util/secrets";

axiosRetry(axios, { retries: 3 });

export const getSignData = async (msgHex: string, pubKey: string) => {
    return axios.post(REST + "/txs/sign_data", {
        msg: msgHex,
        pub_key: pubKey,
    });
};
