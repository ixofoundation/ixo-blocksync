import { Document, Schema, Model, model } from 'mongoose';
import { IDid } from '../../models/did';

export interface IDidModel extends IDid, Document {}

let credentialsSchema = new Schema({
	type: String,
	data: String,
	signer: String
});

export var DidSchema: Schema = new Schema(
	{
		did: {
			type: String,
			index: true,
			unique: true,
			required: true,
		},
		publicKey: {
			type: String,
			required: true
		},
		credentials: [credentialsSchema]
	},
	{ strict: false }
);

DidSchema.pre('save', function(this: IDid, next: any) {
	next();
	return this;
});

export const DidDB: Model<IDidModel> = model<IDidModel>('Did', DidSchema);
