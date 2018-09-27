import { IDid, ICredential } from '../models/did';
import { DidDB } from '../db/models/did';
import { io } from '../server';

export class DidSyncHandler {
	create = (didDoc: IDid) => {
		return new Promise((resolve: Function, reject: Function) => {
			return DidDB.create(didDoc, (err, res) => {
				if (err) {
					reject(err);
				} else {
					io.emit('did created', didDoc);
					resolve(res);
				}
			});
		});
	};

	addCredential = (did: string, credential: ICredential) => {
		return new Promise((resolve: Function, reject: Function) => {
			return DidDB.findOneAndUpdate({ did: did }, { $push: { credentials: credential } }, (err, res) => {
				if (err) {
					reject(err);
				} else {
					io.emit('did updated', { did: did, credental: credential});
					resolve(res);
				}
			});
		});
	};

}
