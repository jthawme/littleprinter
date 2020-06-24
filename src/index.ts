import dotenv from 'dotenv';
import fs from 'fs-extra';
import { exec } from 'child_process';
import * as firebase from 'firebase/app';
import 'firebase/database';
import cron from 'node-cron';

import NewsService from './services/news';
import RedditService from './services/reddit';
import PoetryService from './services/poetry';
import WeatherService from './services/weather';
import DotService from './services/dot';
import FooterService from './services/footer';
import HeaderService from './services/header';

import { createDocument } from './utils/pdf';
import logger from './utils/logger';
import { SERVICES } from './utils/constants';
import { SaveCanvasObject } from './utils/drawing';
import { RedditOptions } from './services/types/reddit';
import { WeatherOptions } from './services/types/weather';
import { NewsOptions } from './services/types/news';
import { tmpFolderPath } from './utils/paths';

dotenv.config();

const app = firebase.initializeApp({
  apiKey: 'AIzaSyB1kR0Nv_gr7PRYrlRM5B3FTf_GCasvOxs',
  authDomain: 'little-printer.firebaseapp.com',
  databaseURL: 'https://little-printer.firebaseio.com',
  projectId: 'little-printer',
  storageBucket: 'little-printer.appspot.com',
  messagingSenderId: '869929008471',
  appId: '1:869929008471:web:21795422c6eca735469212',
});

interface MergedDocument {
  filename: string;
  width: number;
  height: number;
}

type UserObjectItem = {
  name: string;
  options: RedditOptions | WeatherOptions | NewsOptions | false;
};

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

function expandUserObject(obj: UserObjectItem[]) {
  return [
    {
      name: SERVICES.HEADER,
      options: false,
    },
    ...obj.map((o) => [
      o,
      {
        name: SERVICES.DOT,
        options: false,
      },
    ]),
    {
      name: SERVICES.FOOTER,
      options: false,
    },
  ].flat();
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
    return app
      .database()
      .ref('data')
      .once('value')
      .then((snapshot) => snapshot.val());
  }
}

function run(): Promise<MergedDocument> {
  logger.info('Running generation');

  return getUserObject().then((obj) =>
    Promise.all(expandUserObject(obj).map((o) => selectService(o.name, o.options || undefined))).then(
      createMergedDocument,
    ),
  );
}

function createMergedDocument(pages: Array<SaveCanvasObject | null>): MergedDocument {
  const documentWidth = Math.max(...pages.map((p) => p?.width || 0));
  const documentHeight = pages.reduce((prev, curr) => prev + (curr?.height || 0), 0);
  const { doc, filename } = createDocument(documentWidth, documentHeight);
  pages.forEach((page) => {
    if (page) {
      doc.image(page.filePath);
    }
  });
  doc.end();

  return { width: Math.ceil(documentWidth), height: Math.ceil(documentHeight), filename };
}

function cleanupFiles(doc: MergedDocument): Promise<MergedDocument> {
  const tmpFiles = fs.readdirSync(tmpFolderPath(''));

  tmpFiles.forEach((file) => {
    if (!doc.filename.includes(file)) {
      fs.unlinkSync(tmpFolderPath(file));
    }
  });

  return Promise.resolve(doc);
}

function printPaper(): Promise<void> {
  return run()
    .then(cleanupFiles)
    .then(({ filename, width, height }) => {
      if (process.env.NODE_ENV === 'production') {
        exec(`lp -o media=Custom.${width}x${height} tmp/${filename.split('/').pop()}`);
      }
      app.delete();
    })
    .catch((e) => {
      logger.error(e.message);
    });
}

function start(minute = 0, hour = 0) {
  return cron.schedule(`${minute} ${hour} * * *`, () => {
    printPaper().then(() => logger.info('Generated newspaper'));
  });
}

let cronTask: cron.ScheduledTask;

logger.info('Spinning up server');

// Kicks up the
const infoRef = app.database().ref('info');

infoRef.child('online').onDisconnect().set(false);
infoRef.child('online').set(true);

infoRef.on('value', (snapshot) => {
  if (cronTask) {
    cronTask.destroy();
  }

  logger.info('Got info from DB', snapshot.val());

  const { minute, hour } = snapshot.val();
  cronTask = start(minute, hour);
});
