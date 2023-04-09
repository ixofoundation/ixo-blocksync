import axios from "axios";
import axiosRetry from "axios-retry";
import * as Secrets from "./secrets";

axiosRetry(axios, { retries: 3 });

export const sendTransaction = async (txData: any) => {
  try {
    const res = await axios.post(Secrets.REST + "/txs", txData);
    if (res.data.error) return res.data.error;
    else return res.data;
  } catch (error) {
    console.error(error);
  }
};
