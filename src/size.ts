import dotenv from 'dotenv';
import fs from 'fs-extra';
import { exec } from 'child_process';

import { createDocument } from './utils/pdf';
import logger from './utils/logger';
import { SaveCanvasObject, Drawing } from './utils/drawing';
import { tmpFolderPath } from './utils/paths';

dotenv.config();

interface MergedDocument {
  filename: string;
  width: number;
  height: number;
}

function createSize(num: number) {
  const d = new Drawing(num);
  d.wrappedText(`${num}px`, 4, {
    fontStyle: 'smallTitle',
  });
  d.rect(num, 2);

  return d.saveCanvas();
}

function run(): Promise<MergedDocument> {
  return Promise.all([createSize(100), createSize(150), createSize(200)]).then(createMergedDocument);
}

function createMergedDocument(pages: Array<SaveCanvasObject | null>): MergedDocument {
  const documentWidth = Math.max(...pages.map((p) => p?.width || 0));
  const documentHeight = pages.reduce((prev, curr) => prev + (curr?.height || 0), 0);
  const { doc, filename } = createDocument(documentWidth, documentHeight);
  pages.forEach((page) => {
    if (page) {
      doc.image(page.filePath);
    }
  });
  doc.end();

  return {
    filename,
    width: documentWidth,
    height: documentHeight,
  };
}

function cleanupFiles(doc: MergedDocument): Promise<MergedDocument> {
  const tmpFiles = fs.readdirSync(tmpFolderPath(''));

  tmpFiles.forEach((file) => {
    if (!doc.filename.includes(file)) {
      fs.unlinkSync(tmpFolderPath(file));
    }
  });

  return Promise.resolve(doc);
}

run()
  .then(cleanupFiles)
  .then(({ filename, width, height }) => {
    if (process.env.NODE_ENV === 'production') {
      exec(`lp -o media=Custom.${width}x${height} tmp/${filename.split('/').pop()}`);
      console.log('Sent to printer');
      console.log(`lp -o media=Custom.${width}x${height} tmp/${filename.split('/').pop()}`);
    }
  })
  .catch((e) => {
    logger.error(e.message);
  });
