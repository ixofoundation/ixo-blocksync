import { epochsQuery } from "../util/archive-queries";
import { dbQuery } from "./client";

type EpochStartedEventType = {
  epoch_number: number;
  time: Date;
  height: number;
  is_started: boolean;
};

let initiatedEpochs = "none";
/**
 * On Epoch Started Event, because of the little information in the event, we need to query the archive node REST API
 * to get the full epoch information. Then we insert/update the epoch information into the epoch table.
 * Afterwards we can also add the epoch event to the epoch_event table.
 */
export const epochStartedOrEnded = async (p: EpochStartedEventType) => {
  // First query the archive node REST API to get the full epoch information
  const epochs = await epochsQuery(p.height);

  if (!epochs.epochs || epochs.epochs.length === 0) {
    throw new Error(
      "The Matrix is real!! How can you start an epoch if there are no epochs??"
    );
  }

  // ixo.epochs.v1beta1.EpochStartEvent flow
  if (p.is_started) {
    // For each epoch, we need to insert/update the epoch information into the epoch table.
    // Can do this in parallel since only 3 epochs in each environment.
    // We only need to do this in StartEvent, since if there is an EndEvent, there will also always be a StartEvent.
    await Promise.all(
      epochs.epochs.map(async (epoch) => {
        await insertOrUpdateEpoch(epoch);
      })
    );

    // Then we can also add the epoch event to the epoch_event table.
    // We need to get the epoch identifier the event is for from the epochs object.
    let epochIdentifier = epochs.epochs.find(
      (epoch) => epoch.current_epoch == p.epoch_number
    )?.identifier;

    // Since we are presumably only ever going to have 3 epochs, we can make this very custom for ixo.
    // When all 3 epochs are initiated, all 3 epochs will have the same current_epoch and current_epoch_start_time.
    // Then we need to update each one by one per event, check last updated one from initiatedEpochs variable.
    // NOTE: if we add more epochs, we need to update this logic to handle more epochs.
    if (p.epoch_number == 1) {
      switch (initiatedEpochs) {
        case "none":
          epochIdentifier = "day";
          initiatedEpochs = "day";
          break;
        case "day":
          epochIdentifier = "hour";
          initiatedEpochs = "hour";
          break;
        case "hour":
          epochIdentifier = "week";
          initiatedEpochs = "week";
          break;
      }
    }

    await createEpochEvent({ ...p, epoch_identifier: epochIdentifier });
  } else {
    // ixo.epochs.v1beta1.EpochEndEvent flow
    // we can check the epochs object to get the identifier for the epoch where the current_epoch is one more than the epoch_number in the event
    // NOTE: this will work for current IXO 3 epochs since they were started at the same time, if we add more epochs, we need to update this logic.
    const epochIdentifier = epochs.epochs.find(
      (epoch) => epoch.current_epoch == p.epoch_number + 1
    )?.identifier;

    if (!epochIdentifier) {
      throw new Error(
        "The Matrix is really real!! How can you end an epoch if there are no epochs??"
      );
    }

    await epochEnded({ ...p, epoch_identifier: epochIdentifier });
  }
};

type EpochType = {
  identifier: string;
  start_time: Date;
  duration: string;
  current_epoch: string;
  current_epoch_start_time: Date;
  epoch_counting_started: boolean;
  current_epoch_start_height: string;
};

const insertEpochSql = `
INSERT INTO epoch (identifier, start_time, duration, current_epoch, current_epoch_start_time, epoch_counting_started, current_epoch_start_height)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (identifier) DO UPDATE SET start_time = $2, duration = $3, current_epoch = $4, current_epoch_start_time = $5, epoch_counting_started = $6, current_epoch_start_height = $7;
`;

export const insertOrUpdateEpoch = async (e: EpochType) => {
  await dbQuery(insertEpochSql, [
    e.identifier,
    e.start_time,
    e.duration,
    parseInt(e.current_epoch),
    e.current_epoch_start_time,
    e.epoch_counting_started,
    parseInt(e.current_epoch_start_height),
  ]);
};

const createEpochEventSql = `
INSERT INTO epoch_event (epoch_number, epoch_identifier, start_height, start_time)
VALUES ($1, $2, $3, $4);
`;

export const createEpochEvent = async (
  p: EpochStartedEventType & { epoch_identifier: string }
) => {
  await dbQuery(createEpochEventSql, [
    p.epoch_number,
    p.epoch_identifier,
    p.height,
    p.time,
  ]);
};

type EpochEndedEventType = {
  epoch_number: number;
  time: Date;
  height: number;
  epoch_identifier: string;
};

const endEpochEventSql = `
UPDATE epoch_event SET end_height = $1, end_time = $2 WHERE epoch_number = $3 AND epoch_identifier = $4;
`;

export const epochEnded = async (p: EpochEndedEventType) => {
  await dbQuery(endEpochEventSql, [
    p.height,
    p.time,
    p.epoch_number,
    p.epoch_identifier,
  ]);
};
