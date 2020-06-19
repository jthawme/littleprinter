import PDFKit from 'pdfkit';
import fs from 'fs-extra';

import { tmpFolderPath } from './paths';

export function createDocument(width: number, height: number): PDFKit.PDFDocument {
  const doc = new PDFKit({
    margin: 0,
    size: [width, height],
  });
  const name = new Date().getTime().toString();
  doc.pipe(fs.createWriteStream(tmpFolderPath(`${name}.pdf`)));

  return doc;
}
