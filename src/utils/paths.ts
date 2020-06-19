import path from 'path';
import fs from 'fs-extra';

export function rootPath(extraPath: string): string {
  return path.resolve(__dirname, '..', '..', extraPath);
}

export function serviceDataPath(fileName: string): string {
  return path.resolve(rootPath('src/services/data'), fileName);
}

export function tmpFolderPath(fileName: string): string {
  fs.ensureDirSync(rootPath('tmp'));
  return path.resolve(rootPath('tmp'), fileName);
}

export function offlineFolderPath(fileName: string): string {
  fs.ensureDirSync(rootPath('offline'));
  return path.resolve(rootPath('offline'), fileName);
}
