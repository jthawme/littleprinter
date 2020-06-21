import dotenv from 'dotenv';
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

dotenv.config();

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

const UserObject: UserObjectItem[] = [
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
];

Promise.all(expandUserObject(UserObject).map((o) => selectService(o.name, o.options || undefined)))
  .then((pages) => {
    const documentWidth = Math.max(...pages.map((p) => p?.width || 0));
    const documentHeight = pages.reduce((prev, curr) => prev + (curr?.height || 0), 0);
    const doc = createDocument(documentWidth, documentHeight);
    pages.forEach((page) => {
      if (page) {
        doc.image(page.filePath);
      }
    });
    doc.end();
  })
  .catch((e) => {
    logger.error(e.message);
  });
