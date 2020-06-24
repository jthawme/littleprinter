import PDFKit from 'pdfkit';
import fs from 'fs-extra';

import { tmpFolderPath } from './paths';
import { SaveCanvasObject } from './drawing';
import { MergedDocument } from './shared';

export function createDocument(width: number, height: number): { doc: PDFKit.PDFDocument; filename: string } {
  const doc = new PDFKit({
    margin: 0,
    size: [width, height],
  });
  const name = new Date().getTime().toString();
  const filename = tmpFolderPath(`${name}.pdf`);

  doc.pipe(fs.createWriteStream(filename));

  return { doc, filename };
}

export function createMergedDocument(pages: Array<SaveCanvasObject | null>): MergedDocument {
  const documentWidth = Math.max(...pages.map((p) => p?.width || 0));
  const documentHeight = pages.reduce((prev, curr) => prev + (curr?.height || 0), 0);
  const { doc, filename } = createDocument(documentWidth, documentHeight);
  pages.forEach((page) => {
    if (page) {
      doc.image(page.filePath);
    }
  });
  doc.end();

  return { width: Math.ceil(documentWidth), height: Math.ceil(documentHeight), filename };
}
