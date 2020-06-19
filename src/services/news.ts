import axios from 'axios';
import jsonfile from 'jsonfile';

import { GeneralObject } from './types/base';
import { NewsService, NewsOptions, SourceItem, ArticleItem } from './types/news';
import { serviceDataPath } from '../utils/paths';

function newsApi(route: string): string {
  return `https://newsapi.org/v2${route}`;
}

function getSources(): Promise<SourceItem[]> {
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
    });
}

function getHeadlines({ country, category, source, limit = 3 }: NewsOptions): Promise<ArticleItem> {
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
    });
}

/**
 * Method that gets run to generate content and create pdf
 *
 * @param opts any
 */
function run(opts: NewsOptions = {}): Promise<boolean> {
  return getHeadlines(opts).then(() => {
    return true;
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
