import axios from 'axios';
import jsonfile from 'jsonfile';

import { GeneralObject } from './types/base';
import { NewsService, NewsOptions, SourceItem, ArticleItem } from './types/news';
import { serviceDataPath } from '../utils/paths';
import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { getOfflineData, saveOfflineData } from '../utils/offline';
import { SERVICES, CANVAS_WIDTH } from '../utils/constants';
import dayjs from 'dayjs';

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
    const canvas = new Drawing(CANVAS_WIDTH);

    canvas.wrappedText('News', undefined, {
      fontStyle: 'smallTitle',
      finalLineHeight: 0.5,
    });

    const runner = async (idx: number) => {
      if (idx >= articles.length) {
        const imageObject = await canvas.saveCanvas();
        resolve(imageObject);
        return;
      }

      const { source, title, urlToImage, description, publishedAt } = articles[idx];

      if (idx === 0) {
        const imageObject = await canvas.drawImage(urlToImage, 3);
        canvas.resetLastHeight();
        canvas.wrappedText(source.name, 1, {
          fontStyle: 'vsmall',
          x: canvas.columnWidth(3, true),
          finalLineHeight: 0,
        });
        canvas.wrappedText(dayjs(publishedAt).format('HH:mm'), 1, {
          fontStyle: 'vsmall',
          x: canvas.columnWidth(3, true),
        });
        canvas.resetLastHeight(2);
        canvas.pad(imageObject.height);

        canvas.wrappedText(title, 4, {
          fontStyle: 'heading',
          finalLineHeight: 0.5,
        });

        canvas.wrappedText(stripSource(description, source.name), 4, {
          fontStyle: 'small',
        });

        canvas.pad(15);
      } else {
        const titleObject = canvas.wrappedText(title, 3, {
          fontStyle: 'small',
        });
        canvas.resetLastHeight();
        canvas.wrappedText(source.name, 1, {
          fontStyle: 'vsmall',
          x: canvas.columnWidth(3, true),
          finalLineHeight: 0,
        });
        canvas.wrappedText(dayjs(publishedAt).format('HH:mm'), 1, {
          fontStyle: 'vsmall',
          x: canvas.columnWidth(3, true),
        });
        canvas.resetLastHeight(2);
        canvas.pad(titleObject.height);

        canvas.pad(15);
      }

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
  name: SERVICES.NEWS,
  run,
  refresh,
};

export default Service;
