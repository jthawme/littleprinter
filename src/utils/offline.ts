import jsonfile from 'jsonfile';

import { offlineFolderPath } from './paths';

export function getOfflineData<T>(filename: string): Promise<T> {
  return jsonfile.readFile(offlineFolderPath(filename)).catch(() => {
    throw new Error('Error retrieving offline data');
  });
}

export function saveOfflineData<T>(filename: string, data: T): Promise<T> {
  if (process.env.SAVE_OFFLINE) {
    return jsonfile
      .writeFile(offlineFolderPath(filename), data)
      .then(() => data)
      .catch(() => {
        throw new Error('Error saving offline data');
      });
  }

  return Promise.resolve(data);
}
