// import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import { createCanvas, Canvas, loadImage } from 'canvas';

import { tmpFolderPath } from '../utils/paths';

export interface GenericReturn {
  width: number;
  height: number;
}

interface GenericOptions {
  x?: number;
  y?: number;
}
interface WrappedTextOptions extends GenericOptions {
  lineHeight?: number;
  finalLineHeight?: number;
}

interface RectOptions extends GenericOptions {
  color?: string;
}

type InlineArrayFunction = (x: number) => GenericReturn | Promise<GenericReturn>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WrappedImageOptions extends GenericOptions {}

interface SaveOptions {
  name?: string;
  paddingTop?: number;
  paddingBottom?: number;
}

export interface SaveCanvasObject {
  filePath: string;
  fileName: string;
  width: number;
  height: number;
}

export class Drawing {
  canvas: Canvas;
  ctx: CanvasRenderingContext2D;

  sectionHeights: number[];

  constructor(width: number) {
    this.canvas = createCanvas(width, 9999);
    this.ctx = this.canvas.getContext('2d');

    this.sectionHeights = [];

    return this;
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.totalHeight;
  }

  setTranslate(x = 0): void {
    this.ctx.save();
    this.ctx.translate(x, this.totalHeight);
  }

  restoreTranslate(addHeight: number): void {
    this.sectionHeights.push(addHeight);
    this.ctx.restore();
  }

  resetLastHeight(): void {
    this.sectionHeights.pop();
  }

  get totalHeight(): number {
    return this.sectionHeights.reduce((prev, curr) => prev + curr, 0);
  }

  pad(padding: number): void {
    // this.sectionHeights.push(padding);
    this.sectionHeights[this.sectionHeights.length - 1] += padding;
  }

  wrappedText(
    text: string,
    boxWidth?: number,
    { lineHeight = 1, finalLineHeight = 0.2, x: startingX = 0, y: startingY = 0 }: WrappedTextOptions = {},
  ): GenericReturn {
    this.setTranslate(startingX);

    const words = text.split(' ');

    const metrics = this.ctx.measureText('M');
    const { width: spaceWidth } = this.ctx.measureText(' ');
    const actualLineHeight = (metrics.emHeightAscent + metrics.emHeightDescent) * lineHeight;

    let wordX = 0;
    let wordY = startingY + actualLineHeight;

    const wordObjects = words.map((w) => {
      const curr = {
        text: w,
        x: wordX,
        y: wordY,
      };

      const { width } = this.ctx.measureText(w);

      wordX += width + spaceWidth;

      if (wordX >= (boxWidth || this.canvas.width)) {
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

    return {
      width: wordY === startingY + actualLineHeight ? this.ctx.measureText(text).width : boxWidth || this.canvas.width,
      height: wordY + actualLineHeight * finalLineHeight,
    };
  }

  async drawImage(
    image: string,
    drawWidth?: number,
    { x: startingX = 0, y: startingY = 0 }: WrappedImageOptions = {},
  ): Promise<GenericReturn> {
    this.setTranslate(startingX);

    return loadImage(image).then((img) => {
      const imgWidth = drawWidth || this.canvas.width;
      const imgHeight = (imgWidth / img.width) * img.height;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.ctx.drawImage(img as any, 0, startingY, drawWidth || this.canvas.width, imgHeight);

      this.restoreTranslate(imgHeight + startingY);
      return { width: imgWidth, height: imgHeight };
    });
  }

  rect(width: number, height: number, { x: startingX = 0, y: startingY = 0, color = 'black' }: RectOptions = {}): void {
    this.setTranslate();
    this.ctx.fillStyle = color;
    this.ctx.fillRect(startingX, startingY, width, height);
    this.restoreTranslate(startingY + height);
  }

  inline(commands: Array<number | InlineArrayFunction>): Promise<GenericReturn> {
    let x = 0;
    const heights: number[] = [];

    return new Promise((resolve) => {
      const runner = async (idx = 0) => {
        if (idx >= commands.length) {
          const height = Math.max(...heights);
          this.pad(height);

          resolve({
            width: x,
            height,
          });
          return;
        }

        const current = commands[idx];

        if (typeof current === 'number') {
          x += current;
        } else {
          const { width, height } = await Promise.resolve(current(x));

          x += width;
          heights.push(height);

          this.resetLastHeight();
        }

        runner(idx + 1);
      };

      runner();
    });
  }

  saveCanvas({ name = new Date().getTime().toString(), paddingBottom = 10, paddingTop = 0 }: SaveOptions = {}): Promise<
    SaveCanvasObject
  > {
    return new Promise((resolve, reject) => {
      // this.canvas.height = this.totalHeight;

      const saveCanvas = createCanvas(this.canvas.width, this.totalHeight + paddingBottom + paddingTop);
      const saveCtx = saveCanvas.getContext('2d');

      saveCtx.drawImage(this.canvas, 0, paddingTop);

      if (process.env.OFFLINE) {
        saveCtx.font = 'bold 24px Helvetica';
        saveCtx.fillStyle = 'red';
        saveCtx.fillText('Offline mode', 0, 24);
      }

      const buf = saveCanvas.toBuffer();

      const fileName = `${name}.jpg`;
      const filePath = tmpFolderPath(fileName);

      fs.writeFile(filePath, buf, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            filePath,
            fileName,
            width: this.canvas.width,
            height: this.totalHeight + paddingBottom + paddingTop,
          });
        }
      });
    });
  }
}
