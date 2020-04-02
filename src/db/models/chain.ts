import {Document, Model, model, Schema} from 'mongoose';
import {IChain} from '../../models/chain';

export interface IChainModel extends IChain, Document {
}

export var ChainSchema: Schema = new Schema({
  chainId: {
    type: String,
    index: true,
    unique: true
  },
  blockHeight: {
    type: Number,
  }
}, {strict: false});

ChainSchema.pre('save', function (this: IChain, next: any) {
  ChainDB.find({}, function (err, docs) {
    if (docs.length < 1) {
      next();
    } else {
      next(new Error("Only one chain document allowed!"));
    }
  });
});

export const ChainDB: Model<IChainModel> = model<IChainModel>('Chain', ChainSchema);
