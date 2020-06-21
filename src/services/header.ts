import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { CANVAS_WIDTH, SERVICES } from '../utils/constants';

dayjs.extend(advancedFormat);

/**
 * Method that gets run to generate content and create pdf
 *
 * @param opts any
 */
async function run(): Promise<SaveCanvasObject> {
  const d = new Drawing(CANVAS_WIDTH);

  const date = dayjs();
  d.wrappedText(date.format('dddd'), undefined, {
    align: 'right',
    fontStyle: 'title',
    finalLineHeight: 0,
  });
  d.wrappedText(date.format('Do MMMM'), undefined, {
    align: 'right',
    fontStyle: 'title',
    finalLineHeight: 0,
  });

  return d.saveCanvas({ name: 'header' });
}

const Service: { name: string; run: () => Promise<SaveCanvasObject> } = {
  name: SERVICES.HEADER,
  run,
};

export default Service;
