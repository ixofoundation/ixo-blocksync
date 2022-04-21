
import { model, Schema, Model, Document } from 'mongoose';

interface IWithdrawShareEvent extends Document {
    raw_value: string;
    amount: string;
    fee: string;
    withdrawer_did: string;
    bond_did: string;
}


const WithdrawShareSchema: Schema = new Schema({
    raw_value: { type: String, required: true },
    amount: { type: String, required: true },
    fee: { type: String, required: false },
    withdrawer_did: { type: String, required: true },
    bond_did: { type: String, required: true }
});

WithdrawShareSchema.pre('save', function (this: IWithdrawShareEvent, next: any) {
    next();
    return this;
  });
export const WithdrawShare: Model<IWithdrawShareEvent> = model('WithdrawShare', WithdrawShareSchema);