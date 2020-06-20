import axios from 'axios';

import { GeneralObject } from './types/base';
import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { getOfflineData, saveOfflineData } from '../utils/offline';
import { PoetryService, PoetryOptions, PoemItem } from './types/poetry';

/**
 * Returns the prefixed route
 *
 * @param route
 */
function poemApi(route: string): string {
  return `http://poetrydb.org${route}`;
}

/**
 * Gets the headlines of the filtered news
 *
 * @param options
 */
function getRandomPoem({ limit = 25 }: PoetryOptions = {}): Promise<PoemItem> {
  if (process.env.OFFLINE) {
    return getOfflineData<PoemItem>('randompoem.json');
  }

  const params: GeneralObject = {
    limit,
  };

  const getPoem = (): Promise<PoemItem> => {
    return axios
      .get<PoemItem>(poemApi('/random'), {
        params,
      })
      .then((result) => {
        const lineCount = parseInt(result.data.linecount, 10);

        if (lineCount > limit) {
          return getPoem();
        }

        return result.data;
      });
  };

  return getPoem().then((data) => saveOfflineData<PoemItem>('randompoem.json', data));
}

/**
 * Turns the poem data into the visual counterparts
 *
 * @param posts
 */
async function renderPosts(poem: PoemItem): Promise<SaveCanvasObject> {
  const canvas = new Drawing(400);

  canvas.ctx.font = 'bold 15px serif';
  canvas.wrappedText(poem.title);
  canvas.wrappedText(`– ${poem.author}`);

  canvas.pad(10);

  canvas.ctx.font = '13px serif';
  poem.lines.forEach((line) => {
    canvas.wrappedText(line.trim(), canvas.width * 0.8, { x: canvas.width * 0.2 });
  });

  return canvas.saveCanvas({ paddingBottom: 50, paddingTop: 40 });
}

/**
 * Method that gets run to generate content and create pdf
 *
 * @param opts any
 */
function run(opts?: PoetryOptions): Promise<SaveCanvasObject> {
  return getRandomPoem(opts).then((poem) => {
    return renderPosts(poem);
  });
}

const Service: PoetryService = {
  name: 'Poetry Service',
  run,
};

export default Service;
