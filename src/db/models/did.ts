import { Document, Schema, Model, model } from 'mongoose';
import { IDid } from '../../models/did';

export interface IDidModel extends IDid, Document {
}

export var DidSchema: Schema =  new Schema({
    did: {
        type: String,
        index: true,
        unique: true
    },
    publicKey: {
        type: String,
    }
}, { strict: false });

DidSchema.pre('save', function (this: IDid, next: any) {
    next();
    return this;
});

export const DidDB: Model<IDidModel> = model<IDidModel>('Did', DidSchema);