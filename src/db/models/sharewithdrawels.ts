
import { model, Schema, Model, Document } from 'mongoose';

interface IWithdrawShareEvent extends Document {

}


const WithdrawShareSchema: Schema = new Schema({

});

export const WithdrawShare: Model<IWithdrawShareEvent> = model('WithdrawShare', WithdrawShareSchema);