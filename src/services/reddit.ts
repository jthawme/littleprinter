import axios from 'axios';
import dayjs from 'dayjs';

import { GeneralObject } from './types/base';
import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { getOfflineData, saveOfflineData } from '../utils/offline';
import { RedditService, RedditOptions, PostItem } from './types/reddit';
import { drawEmoji } from '../utils/emoji';

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
  { withImage = true, expand = false }: Partial<RedditOptions> = {},
): Promise<SaveCanvasObject> {
  return new Promise((resolve) => {
    const canvas = new Drawing(400);

    const gutter = 10;
    const imageWidth = 100;

    const runner = async (idx: number) => {
      if (idx >= posts.length) {
        const imageObject = await canvas.saveCanvas();
        resolve(imageObject);
        return;
      }

      const { thumbnail, title, ups, created, subreddit_name_prefixed, selftext } = posts[idx].data;

      if (idx === 0) {
        canvas.title(subreddit_name_prefixed);
      }

      await canvas.inline([
        (x: number) => {
          if (!withImage) {
            return { width: 0, height: 0 };
          }

          if (thumbnail && thumbnail !== 'default' && thumbnail !== 'self') {
            return canvas.drawImage(thumbnail, imageWidth, { x });
          } else {
            canvas.rect(imageWidth, 50, { color: 'grey', x });
            return {
              width: imageWidth,
              height: 50,
            };
          }
        },
        withImage ? gutter : 0,
        (x: number) => {
          canvas.ctx.font = '14px Helvetica';
          return canvas.wrappedText(title, withImage ? canvas.width - (imageWidth + gutter) : undefined, { x, y: -2 });
        },
      ]);

      if (expand && selftext) {
        canvas.wrappedText(selftext);
      }

      // Pad for main content
      canvas.pad(5);

      // Draw the upvotes and the date
      await canvas.inline([
        withImage ? imageWidth + gutter : 0,
        (x: number) => drawEmoji('thumbs-up', canvas, 16, { x }),
        2,
        (x: number) => {
          canvas.ctx.font = 'bold 10px Helvetica';
          return canvas.wrappedText(ups.toString(), undefined, { x, y: 3 });
        },
        5,
        (x: number) => drawEmoji('stopwatch', canvas, 16, { x }),
        2,
        (x: number) => {
          canvas.ctx.font = 'bold 10px Helvetica';
          return canvas.wrappedText(dayjs(created * 1000).format('HH:mm D MMM'), undefined, { x, y: 3 });
        },
      ]);

      canvas.pad(20);

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
  name: 'News Service',
  run,
};

export default Service;
