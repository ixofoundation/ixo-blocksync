import axios, { AxiosPromise } from 'axios';

export class Connection {
    THRESHHOLD_FOR_WEBSOCKET = 10;
    chainUri: string;
    _isConnected: boolean;
    _confirmConnectionTimer : NodeJS.Timer;

    constructor(chainUri: string) {
        this._isConnected = false;
        this.chainUri = chainUri;
        this.confirmConnection();
    }

    confirmConnection() {
        const self = this;
        this._confirmConnectionTimer = setInterval( function() {
            self.getLastBlock().then((block: any) => {
                self._isConnected = true;
                clearTimeout(self._confirmConnectionTimer);
                console.log("block: " + JSON.stringify(block));
            })
            .catch((error: any) => {
                console.log("error: " + error);
            });;
        }, 2000)
    }

    isConnected() {
        // console.log("_isConnected: " + this._isConnected)
        return this._isConnected;
    }

    sendTransaction(txData: string) {
        var url = 'http://' + this.chainUri + '//broadcast_tx_sync?tx=' + txData;

        return axios
            .get(url)
            .then(response => {
                if (response.data.result) {
                    return response.data.result;
                } else {
                    throw new Error('Could not submit did');
                }
            })
            .catch(error => {
                return '';
            });
    }

    getBlockResult(height: Number): AxiosPromise {
        var url = 'http://' + this.chainUri + '/block_results?height=';
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
 
    getBlock(height: Number): Promise<any> {
        var url = 'http://' + this.chainUri + '/block?height=';
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

    getLastBlock() {
        return this.getBlock(-1);
    }

    getLastBlockHeight(): AxiosPromise {
        return this.getLastBlock().then((block: any) => {
            return block.header.height;
        })
        .catch((error: any) => {
            console.log(error);
            return -1;
        });

    }
    subscribeToChain(callback: Function) {
        var ws = new WebSocket('ws://' + this.chainUri + '/websocket');
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
