import { registerFont } from 'canvas';
import { rootPath } from './paths';

registerFont(rootPath('src/utils/fonts/gt-pressura-mono-regular.ttf'), {
  family: 'GT Pressura Mono',
});

registerFont(rootPath('src/utils/fonts/gt-pressura-mono-bold.ttf'), {
  family: 'GT Pressura Mono',
  weight: 'bold',
});

// const fonts = {
//   small: '11px "GT Pressura Mono"',
//   title: 'bold 21px "GT Pressura Mono"',
//   smallTitle: 'bold 11px "GT Pressura Mono"',
//   heading: '16px "GT Pressura Mono"',
// };

const fonts = {
  vsmall: 'bold 8px sans-serif',
  small: '10px sans-serif',
  title: 'bold 16px sans-serif',
  smallTitle: 'bold 10px sans-serif',
  heading: '14px sans-serif',
};

export type FontStyle = keyof typeof fonts;

export function useFont(fontStyle: FontStyle, ctx: CanvasRenderingContext2D): void {
  ctx.font = fonts[fontStyle];
}
