import axios from 'axios';
import jsonfile from 'jsonfile';

import { GeneralObject } from './types/base';
import { NewsService, NewsOptions, SourceItem, ArticleItem } from './types/news';
import { serviceDataPath } from '../utils/paths';
import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { getOfflineData, saveOfflineData } from '../utils/offline';

/**
 * Returns the prefixed route
 *
 * @param route
 */
function newsApi(route: string): string {
  return `https://newsapi.org/v2${route}`;
}

/**
 * Strips the news source from the ugly title
 *
 * @param title
 * @param source
 */
function stripSource(title: string, source: string) {
  let newTitle = title;

  newTitle = newTitle.replace(` - ${source}`, '');
  newTitle = newTitle.replace(source, '');

  return newTitle;
}

/**
 * Gets a list of all sources from news api to save for the interface
 */
function getSources(): Promise<SourceItem[]> {
  if (process.env.OFFLINE) {
    return getOfflineData<SourceItem[]>('newsapisources.json');
  }

  return axios
    .get(newsApi('/sources'), {
      params: {
        apiKey: process.env.NEWS_API_KEY,
      },
    })
    .then(({ data }) => {
      if (data.status !== 'ok') {
        throw new Error('Error retrieving sources');
      }

      return data.sources;
    })
    .then((data) => saveOfflineData<SourceItem[]>('newsapisources.json', data));
}

/**
 * Gets the headlines of the filtered news
 *
 * @param options
 */
function getHeadlines({ country, category, source, limit = 3 }: NewsOptions): Promise<ArticleItem[]> {
  if (process.env.OFFLINE) {
    return getOfflineData<ArticleItem[]>('newsapiheadlines.json');
  }

  if (!process.env.NEWS_API_KEY) {
    throw new Error('No News API Key found');
  }

  const params: GeneralObject = {
    apiKey: process.env.NEWS_API_KEY,
    pageSize: limit,
  };

  if (source) {
    params.sources = source;
  } else if (category || country) {
    if (category) {
      params.category = category;
    }

    if (country) {
      params.country = country;
    }
  } else {
    params.country = 'gb';
  }

  return axios
    .get(newsApi(`/top-headlines`), {
      params,
    })
    .then(({ data }) => {
      if (data.status !== 'ok') {
        throw new Error('Error retrieving headlines');
      }

      return data.articles;
    })
    .then((data) => saveOfflineData<ArticleItem[]>('newsapiheadlines.json', data));
}

/**
 * Turns the article data into the visual counterparts
 *
 * @param articles
 */
async function renderArticles(articles: ArticleItem[]): Promise<SaveCanvasObject> {
  return new Promise((resolve) => {
    const canvas = new Drawing(400);

    canvas.title('News');

    const runner = async (idx: number) => {
      if (idx >= articles.length) {
        const imageObject = await canvas.saveCanvas();
        resolve(imageObject);
        return;
      }

      const { source, title, urlToImage, description } = articles[idx];

      if (idx === 0) {
        await canvas.drawImage(urlToImage);
      }

      canvas.ctx.font = '10px Helvetica';
      canvas.wrappedText(source.name);

      canvas.ctx.font = `bold ${idx === 0 ? 32 : 21}px Serif`;
      canvas.wrappedText(stripSource(title, source.name));

      if (idx === 0) {
        canvas.ctx.font = '14px Serif';
        canvas.wrappedText(description);
      }

      canvas.rect(canvas.width * 0.15, 3, { y: 10 });
      canvas.pad(40);

      runner(idx + 1);
    };

    runner(0);
  });
}

/**
 * Method that gets run to generate content and create pdf
 *
 * @param opts any
 */
function run(opts: NewsOptions = {}): Promise<SaveCanvasObject> {
  return getHeadlines(opts).then((articles) => {
    return renderArticles(articles);
  });
}

/**
 * Method that gets run to refresh any data supporting this service
 */
function refresh(): Promise<boolean> {
  return getSources()
    .then((sources: SourceItem[]) => {
      return jsonfile.writeFile(serviceDataPath('newsapi.json'), sources, { spaces: 2 });
    })
    .then(() => {
      return true;
    });
}

const Service: NewsService = {
  name: 'News Service',
  run,
  refresh,
};

export default Service;
