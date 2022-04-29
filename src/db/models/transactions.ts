
import { model, Schema, Model, Document } from 'mongoose';

interface ITransactionEvent extends Document {
    buyer_did: string;
    amount: string;
    max_prices: string;
    bond_did: string;
}


const TransactionSchema: Schema = new Schema({
    buyer_did: { type: String, required: true },
    amount: { type: String, required: true },
    max_prices: { type: String, required: true },
    bond_did: { type: String, required: true }
});

TransactionSchema.pre('save', function (this: ITransactionEvent, next: any) {
    next();
    return this;
  });

export const Transaction: Model<ITransactionEvent> = model('Transaction', TransactionSchema);