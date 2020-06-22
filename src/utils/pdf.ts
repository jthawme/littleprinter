import PDFKit from 'pdfkit';
import fs from 'fs-extra';

import { tmpFolderPath } from './paths';

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
