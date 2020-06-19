import { SaveCanvasObject } from '../../utils/drawing';

export interface RedditOptions {
  subreddit: string;
  limit?: number;
}

export interface PostData {
  title: string;
  thumbnail?: string;
  ups: number;
  created: number;
  subreddit_name_prefixed: string;
}

export interface PostItem {
  data: PostData;
}

export interface RedditService {
  name: string;
  run: (options: RedditOptions) => Promise<SaveCanvasObject>;
}
