import axios, {AxiosPromise} from 'axios';

export class Connection {
  chainUri: string;
  bcRest: string;
  _isConnected: boolean;
  _confirmConnectionTimer: NodeJS.Timer;

  constructor(chainUri: string, bcRest: string) {
    this._isConnected = false;
    this.chainUri = chainUri;
    this.bcRest = bcRest;
    this.confirmConnection();
  }

  confirmConnection() {
    const self = this;
    this._confirmConnectionTimer = setInterval(function () {
      self.testRpcConnection()
        .then(() => {
          self.testRestConnection()
            .then(() => {
              self._isConnected = true;
              clearTimeout(self._confirmConnectionTimer)
            })
            .catch(() => {
              console.log("error connecting to " + self.bcRest)
            })
        })
        .catch(() => {
          console.log("error connecting to " + self.chainUri)
        })
    }, 4000)
  }

  isConnected() {
    return this._isConnected;
  }

  sendTransaction(txData: any) {
    const url = this.bcRest + '/txs';
    return axios
      .post(url, txData)
      .then(response => {
        if (response.data.error) {
          return response.data.error;
        } else {
          return response.data;
        }
      })
      .catch(error => {
        console.log(error);
        return error.response.data.error;
      });
  }

  getBlockResult(height: Number): AxiosPromise {
    let url = this.chainUri + '/block_results?height=';
    if (height > 0) {
      url += height;
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

  getBlock(height: Number): Promise<any> {
    let url = this.chainUri + '/block?height=';
    if (height > 0) {
      url += height;
    }
    return new Promise((resolve: Function, reject: Function) => {
      axios.get(url)
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

  getLastBlock() {
    return this.getBlock(-1);
  }

  testRpcConnection() {
    return new Promise((resolve: Function, reject: Function) => {
      axios.get(this.chainUri + '/health')
        .then(response => {
          if (response.data.result) {
            resolve()
          } else {
            reject()
          }
        })
    })
  }

  testRestConnection() {
    return new Promise((resolve: Function, reject: Function) => {
      axios.get(this.bcRest + '/node_info')
        .then(response => {
          if (response.data.node_info) {
            resolve()
          } else {
            reject()
          }
        })
    })
  }

  getLastBlockHeight(): AxiosPromise {
    return this.getLastBlock()
      .then((block: any) => {
        return block.header.height;
      })
      .catch((error: any) => {
        console.log(error);
        return -1;
      });
  }
}
