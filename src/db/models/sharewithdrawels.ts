
import { model, Schema, Model, Document } from 'mongoose';

interface IWithdrawShareEvent extends Document {
    raw_value: string;
    // amount: string;
    // fee: string;
    transaction: string;
    recipient_did: string;
    bond_did: string;
    height: string;
    timestamp:string;
}


const WithdrawShareSchema: Schema = new Schema({
    raw_value: { type: String, required: true },
    // amount: { type: String, required: true },
    // fee: { type: String, required: false },
    transaction: { type: String, required: true },
    recipient_did: { type: String, required: true },
    bond_did: { type: String, required: true },
    height: { type: String, required: true },
    timestamp: { type: String, required: true },
});

WithdrawShareSchema.pre('save', function (this: IWithdrawShareEvent, next: any) {
    next();
    return this;
  });
export const WithdrawShare: Model<IWithdrawShareEvent> = model('WithdrawShare', WithdrawShareSchema);