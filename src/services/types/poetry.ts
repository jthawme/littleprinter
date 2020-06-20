import { SaveCanvasObject } from '../../utils/drawing';

export interface PoetryOptions {
  limit?: number;
}

export interface PoemItem {
  title: string;
  author: string;
  lines: string[];
  linecount: string;
}

export interface PoetryService {
  name: string;
  run: (options?: PoetryOptions) => Promise<SaveCanvasObject>;
}
