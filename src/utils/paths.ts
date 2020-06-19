import path from 'path';

export function rootPath(extraPath: string): string {
  return path.resolve(__dirname, '..', '..', extraPath);
}

export function serviceDataPath(fileName: string): string {
  return path.resolve(rootPath('src/services/data'), fileName);
}
