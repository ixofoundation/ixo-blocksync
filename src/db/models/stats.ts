import {Document, Model, model, Schema} from 'mongoose';
import {IStats} from "../../models/stats";

export interface IStatsModel extends IStats, Document {
}

export var StatsSchema: Schema = new Schema({
  totalServiceProviders: {
    type: Number,
    default: 0
  },
  totalProjects: {
    type: Number,
    default: 0
  },
  totalEvaluationAgents: {
    type: Number,
    default: 0
  },
  claims: {
    total: {
      type: Number,
      default: 0
    },
    totalSuccessful: {
      type: Number,
      default: 0
    },
    totalSubmitted: {
      type: Number,
      default: 0
    },
    totalPending: {
      type: Number,
      default: 0
    },
    totalRejected: {
      type: Number,
      default: 0
    },
    claimLocations: [{
      long: String,
      lat: String
    }],
  }, strict: false
});

StatsSchema.pre('save', function (this: IStats, next: any) {
  StatsDB.find({}, function (err, docs) {
    if (docs.length < 1) {
      next();
    } else {
      next(new Error("Only one stats document allowed!"));
    }
  });
});

export const StatsDB: Model<IStatsModel> = model<IStatsModel>('Stats', StatsSchema);
