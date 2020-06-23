import axios from "axios";

export class AuthHandler {
  getSignData = (msgHex: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      let rest = (process.env.BC_REST || 'localhost:1317');
      axios.post(rest + '/sign_data', {msg: msgHex})
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
