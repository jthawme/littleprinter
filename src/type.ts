import dotenv from 'dotenv';
import { registerFont } from 'canvas';

import logger from './utils/logger';
import { SaveCanvasObject, Drawing } from './utils/drawing';
import { cleanupFiles, printPaper } from './utils/shared';
import { createMergedDocument } from './utils/pdf';
import { CANVAS_WIDTH } from './utils/constants';
import { rootPath } from './utils/paths';

dotenv.config();

const sizes = [10, 12, 14, 16];

registerFont(rootPath('src/utils/fonts/gt-pressura-mono-regular.ttf'), {
  family: 'GT Pressura Mono',
});

registerFont(rootPath('src/utils/fonts/gt-pressura-mono-bold.ttf'), {
  family: 'GT Pressura Mono',
  weight: 'bold',
});

function paragraphTest(fontFamily: string, fontSize: number, fontWeight = '') {
  const d = new Drawing(CANVAS_WIDTH);

  d.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  d.wrappedText(
    `These are my awards, Mother. From Army. The seal is for marksmanship, and the gorilla is for sand racing. Heart attack never stopped old big bear. We have unlimited juice? This party is going to be off the hook.`,
    4,
    {
      fontStyle: false,
    },
  );

  return d.saveCanvas();
}

function typeTest(fontFamily: string) {
  const d = new Drawing(CANVAS_WIDTH);

  const getFont = (size: number, weight = '') => `${weight} ${size}px ${fontFamily}`;

  ['', 'bold'].forEach((w) => {
    sizes.forEach((s) => {
      d.ctx.font = getFont(s, w);
      d.wrappedText(`${fontFamily} - ${s}px`, 4, {
        fontStyle: false,
      });
    });
  });

  return d.saveCanvas();
}

function generateTypeTest(): Promise<Array<SaveCanvasObject | null>> {
  logger.info('Running generation');

  // return Promise.all([typeTest('sans-serif'), typeTest("'GT Pressura Mono'"), typeTest('monospace')]);
  return Promise.all([typeTest('sans-serif'), paragraphTest('sans-serif', 10)]);
}

function run() {
  logger.info(`Running type test`);

  generateTypeTest()
    .then(createMergedDocument)
    .then(cleanupFiles)
    .then(printPaper)
    .then(() => logger.info('Generated type test'))
    .catch((err) => logger.error(err.message));
}

run();
