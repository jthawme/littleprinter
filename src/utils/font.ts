import { registerFont } from 'canvas';
import { rootPath } from './paths';

registerFont(rootPath('src/utils/fonts/gt-pressura-mono-regular.ttf'), {
  family: 'GT Pressura Mono',
});

registerFont(rootPath('src/utils/fonts/gt-pressura-mono-bold.ttf'), {
  family: 'GT Pressura Mono',
  weight: 'bold',
});

const fonts = {
  small: '9px "GT Pressura Mono"',
  title: 'bold 18px "GT Pressura Mono"',
  smallTitle: 'bold 9px "GT Pressura Mono"',
  heading: '14px "GT Pressura Mono"',
};

export type FontStyle = keyof typeof fonts;

export function useFont(fontStyle: FontStyle, ctx: CanvasRenderingContext2D): void {
  ctx.font = fonts[fontStyle];
}
