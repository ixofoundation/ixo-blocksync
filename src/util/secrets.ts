import * as dotenv from 'dotenv';
import * as fs from 'fs';
import logger from './logger';

if (fs.existsSync('.env')) {
  logger.debug('Using .env file to supply config environment variables');
  dotenv.config({ path: '.env' });
} else {
  logger.debug('Using .env-example file to supply config environment variables');
  dotenv.config({ path: '.env-example' });  // you can delete this after you create your own .env file!
}
export const ENVIRONMENT = process.env.NODE_ENV;

const ignoreEvents = process.env.IGNORE_EVENTS;
const onlyEvents = process.env.ONLY_EVENTS;
export const IGNORE_EVENTS = ignoreEvents ? ignoreEvents.split(',') : undefined; // default undefined => all events
export const ONLY_EVENTS = onlyEvents ? onlyEvents.split(',') : undefined; // default: undefined => all events

logger.info('Ignoring events: ' + IGNORE_EVENTS);
logger.info('Only events: ' + ONLY_EVENTS);

const bondsInfoExtractPeriodBlocks = process.env.BONDS_INFO_EXTRACT_PERIOD_BLOCKS;
export const BONDS_INFO_EXTRACT_PERIOD_BLOCKS = bondsInfoExtractPeriodBlocks ?
  parseInt(bondsInfoExtractPeriodBlocks) : undefined; // default: undefined => no bonds info extracted

logger.info('Bonds info extract period blocks: ' + BONDS_INFO_EXTRACT_PERIOD_BLOCKS)
