import dotenv from 'dotenv';
import NewsService from './services/news';

dotenv.config();

NewsService.run();
NewsService.run({
  source: 'bbc-news',
});
NewsService.run({
  country: 'fr',
});
