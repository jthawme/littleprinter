import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { CANVAS_WIDTH, SERVICES } from '../utils/constants';

/**
 * Method that gets run to generate content and create pdf
 *
 * @param opts any
 */
function run(): Promise<SaveCanvasObject> {
  const d = new Drawing(CANVAS_WIDTH);
  const hei = 6;

  d.ctx.beginPath();
  d.ctx.arc(CANVAS_WIDTH / 2, hei / 2, hei / 2, 0, Math.PI * 2);
  d.pad(hei);
  d.ctx.fill();

  return d.saveCanvas({ name: 'dot' });
}

const Service: { name: string; run: () => Promise<SaveCanvasObject> } = {
  name: SERVICES.DOT,
  run,
};

export default Service;
