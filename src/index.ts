import dotenv from 'dotenv';
import cron from 'node-cron';

import NewsService from './services/news';
import RedditService from './services/reddit';
import PoetryService from './services/poetry';
import WeatherService from './services/weather';
import DotService from './services/dot';
import FooterService from './services/footer';
import HeaderService from './services/header';

import logger from './utils/logger';
import { SERVICES } from './utils/constants';
import { SaveCanvasObject } from './utils/drawing';
import { getData, getInfo, cleanupDb } from './utils/database';
import { cleanupFiles, UserObjectItem, expandUserObject, printPaper } from './utils/shared';
import { createMergedDocument } from './utils/pdf';
import { info } from 'console';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selectService(name: string, opts?: any): Promise<SaveCanvasObject> | Promise<null> {
  switch (name) {
    case SERVICES.NEWS:
      return NewsService.run(opts);
    case SERVICES.POETRY:
      return PoetryService.run();
    case SERVICES.REDDIT:
      return RedditService.run(opts);
    case SERVICES.WEATHER:
      return WeatherService.run(opts);
    case SERVICES.HEADER:
      return HeaderService.run();
    case SERVICES.FOOTER:
      return FooterService.run();
    case SERVICES.DOT:
      return DotService.run();
    default:
      return Promise.resolve(null);
  }
}

function getUserObject(): Promise<UserObjectItem[]> {
  if (process.env.OFFLINE) {
    return Promise.resolve([
      {
        name: SERVICES.NEWS,
        options: { country: 'gb' },
      },
      {
        name: SERVICES.POETRY,
        options: false,
      },
      {
        name: SERVICES.REDDIT,
        options: {
          subreddit: 'r/todayilearned',
        },
      },
      {
        name: SERVICES.WEATHER,
        options: {
          lat: 51.53796,
          lon: -0.11896,
        },
      },
    ]);
  } else {
    return getData();
  }
}

function generate(): Promise<Array<SaveCanvasObject | null>> {
  logger.info('Running generation');

  return getUserObject().then((obj) => {
    logger.info('Got user data', obj);
    return Promise.all(expandUserObject(obj).map((o) => selectService(o.name, o.options || undefined)));
  });
}

function run() {
  return generate()
    .then(createMergedDocument)
    .then(cleanupFiles)
    .then(printPaper)
    .then(() => logger.info('Generated newspaper'))
    .catch((err) => logger.error(err.message));
}

function start(minute = 0, hour = 0) {
  logger.info(`Setting cron to run: ${minute} ${hour} * * *`);

  return cron.schedule(`${minute} ${hour} * * *`, () => {
    logger.info('Running cron job');
    run();
  });
}

let cronTask: cron.ScheduledTask;

logger.info('Spinning up server');

getInfo((value) => {
  if (cronTask) {
    cronTask.destroy();
  }

  logger.info('Got info from DB', value);

  if (process.env.SINGLE_PRINT) {
    run().then(() => {
      cleanupDb();
    });
  } else {
    const { minute, hour } = value;
    cronTask = start(minute, hour);
  }
});
