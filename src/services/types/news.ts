import { SaveCanvasObject } from '../../utils/drawing';

export type Countries =
  | 'ae'
  | 'ar'
  | 'at'
  | 'au'
  | 'be'
  | 'bg'
  | 'br'
  | 'ca'
  | 'ch'
  | 'cn'
  | 'co'
  | 'cu'
  | 'cz'
  | 'de'
  | 'eg'
  | 'fr'
  | 'gb'
  | 'gr'
  | 'hk'
  | 'hu'
  | 'id'
  | 'ie'
  | 'il'
  | 'in'
  | 'it'
  | 'jp'
  | 'kr'
  | 'lt'
  | 'lv'
  | 'ma'
  | 'mx'
  | 'my'
  | 'ng'
  | 'nl'
  | 'no'
  | 'nz'
  | 'ph'
  | 'pl'
  | 'pt'
  | 'ro'
  | 'rs'
  | 'ru'
  | 'sa'
  | 'se'
  | 'sg'
  | 'si'
  | 'sk'
  | 'th'
  | 'tr'
  | 'tw'
  | 'ua'
  | 'us'
  | 've'
  | 'za';

export type Categories = 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology';

export interface NewsOptions {
  country?: Countries;
  category?: Categories;
  limit?: number;
  source?: string;
}

export interface SourceItemFragment {
  id?: string;
  name: string;
}

export interface SourceItem extends SourceItemFragment {
  description: string;
  url: string;
  category: string;
  language: string;
  country: Countries;
}

export interface ArticleItem {
  source: SourceItemFragment;
  author: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

export interface NewsService {
  name: string;
  refresh: () => Promise<boolean>;
  run: (options?: NewsOptions) => Promise<SaveCanvasObject>;
}
