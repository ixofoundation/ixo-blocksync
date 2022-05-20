import { model, Schema, Model, Document } from 'mongoose';

export interface IOutcomepaymentEvent {
    raw_value: string;
    sender_did: string;
    bond_did: string;
    amount: string;
     height:string;
     timestamp:string;
   }
   

   const OutcomePaymentsSchema: Schema = new Schema({
    raw_value: { type: String, required: true },
    bond_did: { type: String, required: true },
    sender_did: { type: String, required: true },
    amount: { type: String, required: true },
    height: { type: String, required: true },
    timestamp: { type: String, required: true },
});

OutcomePaymentsSchema.pre('save', function (this: IOutcomepaymentEvent, next: any) {
    next();
    return this;
  });
export const Outcomepayment: Model<IOutcomepaymentEvent> = model('paymentoutcome', OutcomePaymentsSchema);