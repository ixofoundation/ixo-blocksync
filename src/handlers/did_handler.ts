import { DidDB } from '../db/models/did';

export class DidHandler {
	getDidDocByDid = (did: string) => {
		return new Promise((resolve: Function, reject: Function) => {
			return DidDB.find({ did: did }, (err, res) => {
				if (err) {
					reject(err);
				} else {
					if(res.length === 1){
						resolve(res[0]);
					}else{
						resolve({error: "DID: '" + did + "' not found"});
					}
				}
			});
		});
	};
}
