import fs from 'fs-extra';
import { exec } from 'child_process';

import { RedditOptions } from '../services/types/reddit';
import { WeatherOptions } from '../services/types/weather';
import { NewsOptions } from '../services/types/news';
import { tmpFolderPath } from './paths';
import { SERVICES } from './constants';
import logger from './logger';

export interface MergedDocument {
  filename: string;
  width: number;
  height: number;
}

export type UserObjectItem = {
  name: string;
  options: RedditOptions | WeatherOptions | NewsOptions | boolean;
};

export function cleanupFiles(doc: MergedDocument): Promise<MergedDocument> {
  const tmpFiles = fs.readdirSync(tmpFolderPath(''));

  tmpFiles.forEach((file) => {
    if (!doc.filename.includes(file)) {
      fs.unlinkSync(tmpFolderPath(file));
    }
  });

  return Promise.resolve(doc);
}

export function expandUserObject(obj: UserObjectItem[]): UserObjectItem[] {
  return [
    {
      name: SERVICES.HEADER,
      options: false,
    },
    ...obj.map((o) => [
      o,
      {
        name: SERVICES.DOT,
        options: false,
      },
    ]),
    {
      name: SERVICES.FOOTER,
      options: false,
    },
  ].flat();
}

export function printPaper({ filename, width, height }: MergedDocument): Promise<void | string> {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Skipping print');
    return Promise.resolve();
  }

  logger.info('Printing media');
  const cmd = `lp -o media=Custom.${width}x${height} tmp/${filename.split('/').pop()}`;

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout || stderr);
    });
  });
}
