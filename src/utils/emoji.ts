import { serviceAssetPath } from './paths';
import { Drawing, WrappedImageOptions, GenericReturn } from './drawing';

type Emoji = 'thumbs-up' | 'stopwatch';

export function drawEmoji(
  name: Emoji,
  canvas: Drawing,
  width = 16,
  options: WrappedImageOptions = {},
): Promise<GenericReturn> {
  return canvas.drawImage(serviceAssetPath(`emoji/${name}.png`), width, options);
}
