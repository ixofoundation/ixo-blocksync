import { IDid } from "../models/did";
import { DidDB } from "../db/models/did";

export class DidHandler {

    create = (didDoc: IDid) => {
        return new Promise((resolve: Function, reject: Function) => {
            return DidDB.create({}, didDoc, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    getDidDocByDid = (params: any) => {
        return new Promise((resolve: Function, reject: Function) => {
            return DidDB.find({"did" : params.did}, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res[0]);
                }
            });
        });
    }
}