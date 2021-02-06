import axios from "axios";

export class AuthHandler {
  decodeTx = (txData: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      let rest = (process.env.BC_REST || 'localhost:1317');
      axios.post(rest + '/txs/decode', {tx: txData})
        .then((response) => {
          if (response.status == 200) {
            resolve(response.data);
          } else {
            reject(response.statusText);
          }
        })
        .catch((error) => {
          reject(error.response.data.error);
        });
    })
  }
}
