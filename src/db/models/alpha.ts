
import { model, Schema, Model, Document } from 'mongoose';

interface IAlphachangeEvent extends Document {
    raw_value: string;
    bond_did: string;
    height:string;
    timestamp:string;
}


const AlphaSchema: Schema = new Schema({
    raw_value: { type: String, required: true },
    bond_did: { type: String, required: true },
    height: { type: String, required: true },
    timestamp: { type: String, required: true },
});

AlphaSchema.pre('save', function (this: IAlphachangeEvent, next: any) {
    next();
    return this;
  });
export const Alphachange: Model<IAlphachangeEvent> = model('alpha', AlphaSchema);