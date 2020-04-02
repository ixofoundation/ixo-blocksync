import {IEvent} from '../models/event';
import {EventDB} from '../db/models/event';
import {io} from '../server';

export class EventSyncHandler {
  create = (event: IEvent) => {
    return new Promise((resolve: Function, reject: Function) => {
      return EventDB.create(event, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('event added', event);
          resolve(res);
        }
      });
    });
  };
}
