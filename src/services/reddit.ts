import axios from 'axios';

import { GeneralObject } from './types/base';
import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { getOfflineData, saveOfflineData } from '../utils/offline';
import { RedditService, RedditOptions, PostItem } from './types/reddit';
import { CANVAS_WIDTH, SERVICES } from '../utils/constants';

/**
 * Returns the prefixed route
 *
 * @param route
 */
function redditApi(route: string): string {
  return `https://www.reddit.com/${route}/top.json`;
}

/**
 * Gets the headlines of the filtered news
 *
 * @param options
 */
function getTopPosts({ subreddit, limit = 5 }: RedditOptions): Promise<PostItem[]> {
  if (process.env.OFFLINE) {
    return getOfflineData<PostItem[]>('reddittopposts.json');
  }

  const params: GeneralObject = {
    limit,
  };

  return axios
    .get(redditApi(subreddit), {
      params,
    })
    .then(({ data }) => {
      return data.data.children;
    })
    .then((data) => saveOfflineData<PostItem[]>('reddittopposts.json', data));
}

/**
 * Turns the post data into the visual counterparts
 *
 * @param posts
 */
async function renderPosts(
  posts: PostItem[],
  { withImage = true }: Partial<RedditOptions> = {},
): Promise<SaveCanvasObject> {
  return new Promise((resolve) => {
    const canvas = new Drawing(CANVAS_WIDTH);

    const runner = async (idx: number) => {
      if (idx >= posts.length) {
        const imageObject = await canvas.saveCanvas();
        resolve(imageObject);
        return;
      }

      const { thumbnail, title, subreddit_name_prefixed } = posts[idx].data;

      if (idx === 0) {
        canvas.title('Reddit');
        canvas.resetLastHeight();
        canvas.wrappedText(subreddit_name_prefixed, 4, {
          fontStyle: 'smallTitle',
          align: 'right',
        });

        canvas.pad(5);
      }

      if (thumbnail && thumbnail !== 'default' && thumbnail !== 'self') {
        await canvas.drawImage(thumbnail, 2);
        canvas.pad(5);
      }

      canvas.wrappedText(title, 4);

      canvas.pad(15);

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
function run(opts: RedditOptions): Promise<SaveCanvasObject> {
  return getTopPosts(opts).then((posts) => {
    return renderPosts(posts, opts);
  });
}

const Service: RedditService = {
  name: SERVICES.REDDIT,
  run,
};

export default Service;
