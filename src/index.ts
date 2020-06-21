import dotenv from 'dotenv';
import NewsService from './services/news';
import RedditService from './services/reddit';
import PoetryService from './services/poetry';
import WeatherService from './services/weather';

import { createDocument } from './utils/pdf';
import logger from './utils/logger';

dotenv.config();

Promise.all([
  NewsService.run({
    source: 'bbc-news',
  }),
  NewsService.run({
    category: 'technology',
    country: 'us',
  }),
  RedditService.run({
    subreddit: 'r/jokes',
    expand: true,
    withImage: false,
  }),
  PoetryService.run(),
  WeatherService.run({
    lat: 51.53796,
    lon: -0.11896,
  }),
  RedditService.run({
    subreddit: 'r/todayilearned',
  }),
])
  .then((pages) => {
    const documentWidth = Math.max(...pages.map((p) => p.width));
    const documentHeight = pages.reduce((prev, curr) => prev + curr.height, 0);
    const doc = createDocument(documentWidth, documentHeight);
    pages.forEach((page) => {
      doc.image(page.filePath);
    });
    doc.end();
  })
  .catch((e) => {
    logger.error(e.message);
  });
