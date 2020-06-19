import path from 'path';

export function rootPath(extraPath: string): string {
  return path.resolve(__dirname, '..', '..', extraPath);
}
