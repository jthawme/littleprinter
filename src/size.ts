import dotenv from 'dotenv';
import fs from 'fs-extra';
import { exec } from 'child_process';

import { createDocument } from './utils/pdf';
import logger from './utils/logger';
import { SaveCanvasObject, Drawing } from './utils/drawing';
import { tmpFolderPath } from './utils/paths';

dotenv.config();

function createSize(num: number) {
  const d = new Drawing(num);
  d.wrappedText(`${num}px`, 4, {
    fontStyle: 'smallTitle',
  });
  d.rect(num, 2);

  return d.saveCanvas();
}

function run(): Promise<string> {
  return Promise.all([createSize(100), createSize(150), createSize(200)]).then(createMergedDocument);
}

function createMergedDocument(pages: Array<SaveCanvasObject | null>): string {
  const documentWidth = Math.max(...pages.map((p) => p?.width || 0));
  const documentHeight = pages.reduce((prev, curr) => prev + (curr?.height || 0), 0);
  const { doc, filename } = createDocument(documentWidth, documentHeight);
  pages.forEach((page) => {
    if (page) {
      doc.image(page.filePath);
    }
  });
  doc.end();

  return filename;
}

function cleanupFiles(filename: string): Promise<string> {
  const tmpFiles = fs.readdirSync(tmpFolderPath(''));

  tmpFiles.forEach((file) => {
    if (!filename.includes(file)) {
      fs.unlinkSync(tmpFolderPath(file));
    }
  });

  return Promise.resolve(filename);
}

run()
  .then(cleanupFiles)
  .then((filename) => {
    if (process.env.NODE_ENV === 'production') {
      exec(`lp -o fit-to-page ${filename}`);
      console.log('Sent to printer');
      console.log(`lp -o fit-to-page ${filename}`);
    }
  })
  .catch((e) => {
    logger.error(e.message);
  });
