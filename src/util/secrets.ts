import * as dotenv from 'dotenv';
import * as fs from 'fs';
import logger from './logger';

if (fs.existsSync('.env')) {
  logger.debug('Using .env file to supply config environment variables');
  dotenv.config({path: '.env'});
} else {
  logger.debug('Using .env-example file to supply config environment variables');
  dotenv.config({path: '.env-example'});  // you can delete this after you create your own .env file!
}
export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === 'production'; // Anything else is treated as 'dev'
export const MONGODB_URI = prod ? process.env['MONGODB_URI'] : process.env['MONGODB_URI_LOCAL'];

const ignoreEvents = process.env.IGNORE_EVENTS;
const onlyEvents = process.env.ONLY_EVENTS;
export const IGNORE_EVENTS = ignoreEvents ? ignoreEvents.split(',') : undefined; // default undefined => all events
export const ONLY_EVENTS = onlyEvents ? onlyEvents.split(',') : undefined; // default: undefined => all events

logger.info('Ignoring events: ' + IGNORE_EVENTS);
logger.info('Only events: ' + ONLY_EVENTS);

if (!MONGODB_URI) {
  logger.error('No mongo connection string. Set MONGODB_URI environment variable.');
  process.exit(1);
}
