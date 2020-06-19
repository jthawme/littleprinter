// import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import { createCanvas, Canvas, loadImage } from 'canvas';

import { tmpFolderPath } from '../utils/paths';

interface GenericOptions {
  x?: number;
  y?: number;
}
interface WrappedTextOptions extends GenericOptions {
  lineHeight?: number;
  finalLineHeight?: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface WrappedImageOptions extends GenericOptions {}

interface SaveOptions {
  name?: string;
  paddingTop?: number;
  paddingBottom?: number;
}

export class Drawing {
  canvas: Canvas;
  ctx: CanvasRenderingContext2D;

  totalHeight: number;

  constructor(width: number) {
    this.canvas = createCanvas(width, 9999);
    this.ctx = this.canvas.getContext('2d');

    this.totalHeight = 0;

    return this;
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.totalHeight;
  }

  setTranslate(): void {
    this.ctx.save();
    this.ctx.translate(0, this.totalHeight);
  }

  restoreTranslate(addHeight: number): void {
    this.totalHeight += addHeight;
    this.ctx.restore();
  }

  wrappedText(
    text: string,
    boxWidth: number,
    { lineHeight = 1, finalLineHeight = 0.2, x: startingX = 0, y: startingY = 0 }: WrappedTextOptions = {},
  ): void {
    this.setTranslate();

    const words = text.split(' ');

    const metrics = this.ctx.measureText('M');
    const { width: spaceWidth } = this.ctx.measureText(' ');
    const actualLineHeight = (metrics.emHeightAscent + metrics.emHeightDescent) * lineHeight;

    let wordX = startingX;
    let wordY = startingY + actualLineHeight;

    const wordObjects = words.map((w) => {
      const curr = {
        text: w,
        x: wordX,
        y: wordY,
      };

      const { width } = this.ctx.measureText(w);

      wordX += width + spaceWidth;

      if (wordX >= boxWidth) {
        wordX = width + spaceWidth;
        wordY += actualLineHeight;

        curr.x = 0;
        curr.y = wordY;
      }

      return curr;
    });

    wordObjects.forEach(({ text, x, y }) => {
      this.ctx.fillText(text, x, y);
    });

    this.restoreTranslate(wordY + actualLineHeight * finalLineHeight);
  }

  async drawImage(
    image: string,
    drawWidth?: number,
    { x: startingX = 0, y: startingY = 0 }: WrappedImageOptions = {},
  ): Promise<void> {
    this.setTranslate();

    return loadImage(image).then((img) => {
      const imgWidth = drawWidth || this.canvas.width;
      const imgHeight = (imgWidth / img.width) * img.height;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.ctx.drawImage(img as any, startingX, startingY, drawWidth || this.canvas.width, imgHeight);

      this.restoreTranslate(imgHeight + startingY);
      return;
    });
  }

  rect(width: number, height: number, { x: startingX = 0, y: startingY = 0 }: GenericOptions = {}): void {
    this.setTranslate();
    this.ctx.fillRect(startingX, startingY, width, height);
    this.restoreTranslate(startingY + height);
  }

  saveCanvas({ name = new Date().getTime().toString(), paddingBottom = 10, paddingTop = 0 }: SaveOptions = {}): Promise<
    boolean
  > {
    return new Promise((resolve, reject) => {
      // this.canvas.height = this.totalHeight;

      const saveCanvas = createCanvas(this.canvas.width, this.totalHeight + paddingBottom + paddingTop);
      const saveCtx = saveCanvas.getContext('2d');

      saveCtx.drawImage(this.canvas, 0, paddingTop);

      const buf = saveCanvas.toBuffer();

      fs.writeFile(tmpFolderPath(`${name}.jpg`), buf, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
}

// export function createDocument(name = new Date().getTime().toString()): PDFKit.PDFDocument {
//   fs.ensureDirSync(tmpFolderPath(''));

//   const doc = new PDFDocument();
//   doc.pipe(fs.createWriteStream(tmpFolderPath(`${name}.pdf`)));

//   return doc;
// }
