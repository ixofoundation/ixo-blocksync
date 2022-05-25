import axios, {AxiosPromise} from 'axios';

export class Connection {
  chainUri: string;
  bcRest: string;
  bondsInfoExtractPeriod: number | undefined;
  _isConnected: boolean;
  _confirmConnectionTimer: NodeJS.Timer;

  constructor(chainUri: string, bcRest: string, bondsInfoExtractPeriod: number | undefined) {
    this._isConnected = false;
    this.chainUri = chainUri;
    this.bcRest = bcRest;
    this.bondsInfoExtractPeriod = bondsInfoExtractPeriod;
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

  getBlockResult(height: Number | String): AxiosPromise {
    const url = this.chainUri + '/block_results?height=' + height;
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

  getBlock(height: Number | String): Promise<any> {
    const url = this.chainUri + '/block?height=' + height;
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
          console.log("\n***\n***\nerror: Failed to get Block");
          console.log("\n***\n***\nerror: " + error);
          reject(error);
        });
    })
  }

  getBondsInfo(height: number): AxiosPromise {
    if (!this.bondsInfoExtractPeriod || height % this.bondsInfoExtractPeriod != 0) {
      return new Promise((resolve: Function) => {
        resolve('')
      })
    }

    const url = this.bcRest + '/bonds_detailed?height=' + height;
    return axios
      .get(url)
      .then(response => {
        if (response.data) {
          return response.data;
        } else {
          return {}
        }
      })
      .catch(err => {
        console.log("\n***\n***\nerror: " + err);
        console.log("\n***\n***\nerror: Failed to get BondInfo");
        return '';
      });
  }

  getLastBlock() {
    return this.getBlock("");
  }

  testRpcConnection() {
    return new Promise((resolve: Function, reject: Function) => {
      axios.get(this.chainUri + '/health')
        .then(response => {
          console.log(response);
          console.log(this.bcRest + '/health');

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
          console.log(response);
          console.log(this.bcRest + '/node_info');
          
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
