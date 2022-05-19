
import { model, Schema, Model, Document } from 'mongoose';

interface IWithdrawReserveEvent extends Document {
    raw_value: string;
    amount: string;
    fee: string;
    withdrawer_did: string;
    bond_did: string;
    height: string;
    timestamp:string;
}


const WithdrawReserveSchema: Schema = new Schema({
    raw_value: { type: String, required: true },
    amount: { type: String, required: true },
    fee: { type: String, required: false },
    withdrawer_did: { type: String, required: true },
    bond_did: { type: String, required: true },
    height: { type: String, required: true },
    timestamp: { type: String, required: true },
});
WithdrawReserveSchema.pre('save', function (this: IWithdrawReserveEvent, next: any) {
    next();
    return this;
  });

export const WithdrawReserve: Model<IWithdrawReserveEvent> = model('WithdrawReserveSchema', WithdrawReserveSchema);