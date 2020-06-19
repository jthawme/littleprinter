import dotenv from 'dotenv';
import NewsService from './services/news';
import RedditService from './services/reddit';

import { createDocument } from './utils/pdf';
import logger from './utils/logger';
// import { Drawing } from './utils/drawing';

dotenv.config();

Promise.all([
  NewsService.run({
    source: 'google-news-uk',
  }),
  NewsService.run({
    category: 'entertainment',
    country: 'us',
  }),
  RedditService.run({
    subreddit: 'r/todayilearned',
  }),
  RedditService.run({
    subreddit: 'r/poppunkers',
  }),
])
  .then((pages) => {
    const documentWidth = Math.max(...pages.map((p) => p.width));
    const documentHeight = pages.reduce((prev, curr) => prev + curr.height, 0);

    const doc = createDocument(documentWidth, documentHeight);

    pages.forEach((page) => doc.image(page.filePath));

    doc.end();
  })
  .catch((e) => logger.error(e.message()));
