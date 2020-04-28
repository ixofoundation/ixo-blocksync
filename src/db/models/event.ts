import {Document, Model, model, Schema} from 'mongoose';
import {IEvent} from '../../models/event';

export interface IEventModel extends IEvent, Document {
}

let KVPairSchema = new Schema({
  key: String,
  value: String,
});

export var EventSchema: Schema = new Schema({
  type: {
    type: String,
    index: true,
  },
  attributes: {
    type: [KVPairSchema],
  },
  eventIndex: {
    type: Number,
  },
  blockHeight: {
    type: Number,
  },
}, {strict: false});

EventSchema.pre('save', function (this: IEvent, next: any) {
  next();
  return this;
});

export const EventDB: Model<IEventModel> = model<IEventModel>('Event', EventSchema);
