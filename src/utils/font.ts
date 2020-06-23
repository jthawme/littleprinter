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
  vsmall: 'bold 11px monospace',
  small: '14px monospace',
  title: 'bold 26px monospace',
  smallTitle: 'bold 14px monospace',
  heading: '21px monospace',
};

export type FontStyle = keyof typeof fonts;

export function useFont(fontStyle: FontStyle, ctx: CanvasRenderingContext2D): void {
  ctx.font = fonts[fontStyle];
}
