import dotenv from 'dotenv';
import NewsService from './services/news';
import { createDocument } from './utils/pdf';
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
]).then((pages) => {
  const documentWidth = Math.max(...pages.map((p) => p.width));
  const documentHeight = pages.reduce((prev, curr) => prev + curr.height, 0);

  const doc = createDocument(documentWidth, documentHeight);

  pages.forEach((page) => doc.image(page.filePath));

  doc.end();
});
