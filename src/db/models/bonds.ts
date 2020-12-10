import {Document, Model, model, Schema} from 'mongoose';
import {IBond} from '../../models/bonds';

export interface IBondModel extends IBond, Document {
}

export var BondSchema: Schema = new Schema(
  {},  // TODO
  {strict: false}
);

BondSchema.pre('save', function (this: IBond, next: any) {
  next();
  return this;
});

export const BondDB: Model<IBondModel> = model<IBondModel>('Bond', BondSchema);
