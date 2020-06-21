// import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import { createCanvas, Canvas, loadImage } from 'canvas';

import { tmpFolderPath } from '../utils/paths';
import { useFont, FontStyle } from './font';
import { SERVICE_PADDING } from './constants';

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
  align?: 'left' | 'center' | 'right';
  fontStyle?: FontStyle;
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

  gutter = 10;

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

  setTranslate(x = 0, y = 0): void {
    this.ctx.save();
    this.ctx.translate(x, this.totalHeight + y);
  }

  restoreTranslate(addHeight: number): void {
    this.sectionHeights.push(addHeight);
    this.ctx.restore();
  }

  resetLastHeight(n = 1): void {
    for (let i = 0; i < n; i++) {
      this.sectionHeights.pop();
    }
  }

  columnWidth(col: number, withGutter = false): number {
    const singleColumn = (this.width - this.gutter * 3) / 4;
    const gutterLength = withGutter ? col : col - 1;
    return singleColumn * col + this.gutter * gutterLength;
  }

  getWidth(num?: number): number {
    if (!num) {
      return this.width;
    }

    return num <= 4 ? this.columnWidth(num) : num;
  }

  get totalHeight(): number {
    return this.sectionHeights.reduce((prev, curr) => prev + curr, 0);
  }

  pad(padding: number): void {
    this.sectionHeights.push(padding);
  }

  wrappedText(
    text: string,
    boxWidth?: number,
    {
      lineHeight = 1,
      finalLineHeight = 0.2,
      x: startingX = 0,
      y: startingY = 0,
      align = 'left',
      fontStyle = 'small',
    }: WrappedTextOptions = {},
  ): GenericReturn {
    // Sets starting translation point
    this.setTranslate(startingX, startingY);

    // Configures the font
    useFont(fontStyle, this.ctx);

    // Splits all words into array
    const words = text.split(' ').map((w, idx, arr) => (idx < arr.length - 1 ? `${w} ` : w));

    // Apparently capital M is most representative of height
    const metrics = this.ctx.measureText('M');

    // Get Width and Height of rows and column
    const rowHeight = (metrics.emHeightAscent + metrics.emHeightDescent) * lineHeight;
    const columnWidth = this.getWidth(boxWidth);

    const rows: Array<Array<{ word: string; width: number }>> = [[]];

    let wordX = 0;

    words.forEach((w) => {
      const { width } = this.ctx.measureText(w);
      wordX += width;

      if (wordX >= columnWidth) {
        rows.push([]);
        wordX = 0;
      }

      rows[rows.length - 1].push({ word: w, width });
    });

    rows.forEach((row) => {
      this.ctx.translate(0, rowHeight);

      const rowWidth = row.reduce((p, c) => p + c.width, 0);
      let rowX = 0;

      const getX = () => {
        switch (align) {
          case 'right':
            return columnWidth - rowWidth + rowX;
          case 'center':
            return (columnWidth - rowWidth) / 2 + rowX;
          case 'left':
          default:
            return rowX;
        }
      };

      row.forEach(({ word, width }) => {
        this.ctx.fillText(word, getX(), 0);
        rowX += width;
      });
    });

    const totalHeight = rows.length * rowHeight + rowHeight * finalLineHeight;

    this.restoreTranslate(totalHeight);

    return {
      width: rows.length > 1 ? columnWidth : rows[0].reduce((p, c) => p + c.width, 0),
      height: totalHeight,
    };
  }

  async drawImage(
    image: string,
    drawWidth?: number,
    { x: startingX = 0, y: startingY = 0 }: WrappedImageOptions = {},
  ): Promise<GenericReturn> {
    this.setTranslate(startingX);

    const columnWidth = this.getWidth(drawWidth);

    return loadImage(image).then((img) => {
      const imgWidth = columnWidth;
      const imgHeight = (imgWidth / img.width) * img.height;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.ctx.drawImage(img as any, 0, startingY, columnWidth, imgHeight);

      this.restoreTranslate(imgHeight + startingY);
      return { width: columnWidth, height: imgHeight };
    });
  }

  rect(
    width: number,
    height: number,
    { x: startingX = 0, y: startingY = 0, color = 'black' }: RectOptions = {},
  ): GenericReturn {
    this.setTranslate();
    this.ctx.fillStyle = color;
    this.ctx.fillRect(startingX, startingY, this.getWidth(width), height);
    this.restoreTranslate(startingY + height);

    return {
      width: this.getWidth(width),
      height,
    };
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
          const heightsSize = this.sectionHeights.length;
          const { width, height } = await Promise.resolve(current(x));

          x += width;
          heights.push(height);

          if (this.sectionHeights.length !== heightsSize) {
            this.resetLastHeight();
          }
        }

        runner(idx + 1);
      };

      runner();
    });
  }

  title(title: string): void {
    this.wrappedText(title, 4, {
      fontStyle: 'smallTitle',
    });
  }

  saveCanvas({ name = new Date().getTime().toString(), paddingBottom = 0, paddingTop = 0 }: SaveOptions = {}): Promise<
    SaveCanvasObject
  > {
    return new Promise((resolve, reject) => {
      // this.canvas.height = this.totalHeight;
      const height = this.totalHeight + paddingBottom + paddingTop + SERVICE_PADDING;

      const saveCanvas = createCanvas(this.canvas.width, height);
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
            height,
          });
        }
      });
    });
  }
}
