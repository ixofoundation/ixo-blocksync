import axios from "axios";

export class AuthHandler {
  getSignData = (msgHex: string, pubKey: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      const rest = (process.env.BC_REST || 'http://localhost:1317');
      axios.post(rest + '/txs/sign_data', {msg: msgHex, pub_key: pubKey})
        .then((response) => {
          if (response.status == 200) {
            resolve(response.data);
          } else {
            reject(response.statusText);
          }
        })
        .catch((error) => {
          console.log(error.response.data.error)
          reject(error.response.data.error);
        });
    })
  }

  decodeTx = (txData: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      let rest = (process.env.BC_REST || 'localhost:1317');
      axios.post(rest + '/txs/decode', {tx: txData})
        .then((response) => {
          if (response.status == 200) {
            resolve(response.data);
          } else {
            console.log("itsa me mario");
            
            reject(response.statusText);
          }
        })
        .catch((error) => {
          console.log(error.response.data.error)
          reject(error.response.data.error);
        });
    })
  }
}
