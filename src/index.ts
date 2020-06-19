import dotenv from 'dotenv';
// import NewsService from './services/news';
import { Drawing } from './utils/drawing';

dotenv.config();

(async function () {
  const canvas = new Drawing(400);
  canvas.ctx.font = '10px Helvetica';
  canvas.wrappedText('This is much longer text to try and wrap up, ooh baby', 200);

  canvas.rect(canvas.width, 4);

  canvas.ctx.font = '50px Helvetica';
  canvas.wrappedText('This text should be beneath i believe', 400);

  canvas.rect(canvas.width, 4);

  await canvas.drawImage('https://source.unsplash.com/random');

  canvas.saveCanvas();
})();
