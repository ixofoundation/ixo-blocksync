import {EventDB} from '../db/models/event';

export class EventHandler {
  getEventsByType = (type: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      return EventDB.find({type: type}, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  };
}
