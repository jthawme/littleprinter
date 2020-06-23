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
  vsmall: 'bold 8px monospace',
  small: '10px monospace',
  title: 'bold 18px monospace',
  smallTitle: 'bold 10px monospace',
  heading: '14px monospace',
};

export type FontStyle = keyof typeof fonts;

export function useFont(fontStyle: FontStyle, ctx: CanvasRenderingContext2D): void {
  ctx.font = fonts[fontStyle];
}
