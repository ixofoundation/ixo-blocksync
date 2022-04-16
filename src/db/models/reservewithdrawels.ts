
import { model, Schema, Model, Document } from 'mongoose';

interface IWithdrawReserveEvent extends Document {

}


const WithdrawReserveSchema: Schema = new Schema({

});

export const WithdrawReserve: Model<IWithdrawReserveEvent> = model('WithdrawReserveSchema', WithdrawReserveSchema);