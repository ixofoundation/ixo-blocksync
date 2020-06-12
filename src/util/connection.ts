import axios, {AxiosPromise} from 'axios';

export class Connection {
  THRESHHOLD_FOR_WEBSOCKET = 10;
  chainURL: string;
  restURL: string;
  _isConnected: boolean;
  _confirmConnectionTimer: NodeJS.Timer;

  constructor(chainURL: string, restURL: string) {
    this._isConnected = false;
    this.chainURL = chainURL;
    this.restURL = restURL;
    this.confirmConnection();
  }

  confirmConnection() {
    const self = this;
    this._confirmConnectionTimer = setInterval(function () {
      self.getLastBlockRpc()
        .then((block: any) => {
          self.getNodeInfoRest().then((block: any) => {
            self._isConnected = true;
            clearTimeout(self._confirmConnectionTimer);
          }).catch((error: any) => {
            console.log("error (rest): " + error);
          });
        })
        .catch((error: any) => {
          console.log("error (rpc): " + error);
        });
    }, 2000)
  }

  isConnected() {
    return this._isConnected;
  }

  sendTransactionRpc(txData: string) {
    const url = 'http://' + this.chainURL + '/broadcast_tx_sync?tx=' + txData;
    return axios
      .get(url)
      .then(response => {
        if (response.data.result) {
          return response.data.result;
        } else {
          return response.data.error;
        }
      })
      .catch(error => {
        console.log(error);
        return error.response.data.error;
      });
  }

  sendTransactionRest(txData: string, autoGas: boolean) {
    const broadcastFormat = {
      "mode": "sync",
      "tx": txData
    }
    const url = 'http://' + this.restURL + (autoGas ? '/txs_auto_gas' : '/txs');
    return axios
      .post(url, JSON.stringify(broadcastFormat))
      .then(response => {
        if (response.data) {
          return response.data;
        } else {
          return response;
        }
      })
      .catch(error => {
        console.log(error);
        return error.response.data.error;
      });
  }

  getBlockResultRpc(height: Number): AxiosPromise {
    let url = 'http://' + this.chainURL + '/block_results?height=';
    if (height > 0) {
      url = url + height;
    }
    return axios
      .get(url)
      .then(response => {
        if (response.data.result) {
          return response.data.result;
        } else {
          throw new Error('No more blocks');
        }
      })
      .catch(() => {
        return '';
      });
  }

  getBlockRpc(height: Number): Promise<any> {
    let url = 'http://' + this.chainURL + '/block?height=';
    if (height > 0) {
      url = url + height;
    }
    return new Promise((resolve: Function, reject: Function) => {
      axios
        .get(url)
        .then(response => {
          if (response.data.result.block) {
            resolve(response.data.result.block);
          } else {
            reject(new Error('No more blocks'));
          }
        })
        .catch(error => {
          console.log("\n***\n***\nerror: " + error);
          reject(error);
        });
    })
  }

  getNodeInfoRest(): Promise<any> {
    let url = 'http://' + this.restURL + '/node_info';
    return new Promise((resolve: Function, reject: Function) => {
      axios
        .get(url)
        .then(response => {
          resolve(response);
        })
        .catch(error => {
          console.log("\n***\n***\nerror: " + error);
          reject(error);
        });
    })
  }

  getLastBlockRpc() {
    return this.getBlockRpc(-1);
  }

  getLastBlockHeightRpc(): AxiosPromise {
    return this.getLastBlockRpc()
      .then((block: any) => {
        return block.header.height;
      })
      .catch((error: any) => {
        console.log(error);
        return -1;
      });
  }

  subscribeToChain(callback: Function) {
    var ws = new WebSocket('ws://' + this.chainURL + '/websocket');
    ws.onmessage = event => {
      callback(JSON.parse(event.data.result.block));
    };

    ws.onopen = () => {
      ws.send(
        `{"jsonrpc": "2.0", "method": "subscribe", "params": {"query": "tm.event='NewBlock'" }, "id": "ixo-explorer"}`
      );
    };
  }
}
