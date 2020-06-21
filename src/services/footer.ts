import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { CANVAS_WIDTH, SERVICES } from '../utils/constants';
import { loadImage } from 'canvas';
import { serviceAssetPath } from '../utils/paths';

/**
 * Method that gets run to generate content and create pdf
 *
 * @param opts any
 */
async function run(): Promise<SaveCanvasObject> {
  const d = new Drawing(CANVAS_WIDTH);

  const img = await loadImage(serviceAssetPath('be_safe.png'));
  const wid = CANVAS_WIDTH;
  const hei = (CANVAS_WIDTH / img.width) * img.height;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  d.ctx.drawImage(img as any, 0, 0, wid, hei);
  d.pad(hei);

  return d.saveCanvas({ name: 'footer' });
}

const Service: { name: string; run: () => Promise<SaveCanvasObject> } = {
  name: SERVICES.FOOTER,
  run,
};

export default Service;
