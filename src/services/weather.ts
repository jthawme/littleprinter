import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

import { GeneralObject } from './types/base';
import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { getOfflineData, saveOfflineData } from '../utils/offline';
import { WeatherService, WeatherOptions, WeatherItem } from './types/weather';
import { CANVAS_WIDTH, SERVICES } from '../utils/constants';
import { serviceAssetPath } from '../utils/paths';

/**
 * Returns the prefixed route
 *
 * @param route
 */
function weatherApi(route: string): string {
  return `https://api.openweathermap.org/data/2.5${route}`;
}

function weatherIcon(icon: string): string {
  return serviceAssetPath(`weather/${icon.replace('n', 'd')}.png`);
}

/**
 * Gets the headlines of the filtered news
 *
 * @param options
 */
function getForecase({ lat, lon }: WeatherOptions): Promise<WeatherItem> {
  if (process.env.OFFLINE) {
    return getOfflineData<WeatherItem>('hourlyweather.json');
  }

  const params: GeneralObject = {
    lat,
    lon,
    exclude: 'current,hourly,minutely',
    units: 'metric',
    appid: process.env.WEATHER_API_KEY,
  };

  return axios
    .get<WeatherItem>(weatherApi('/onecall'), {
      params,
    })
    .then((result) => {
      return result.data;
    })
    .then((data) => saveOfflineData<WeatherItem>('hourlyweather.json', data));
}

/**
 * Turns the poem data into the visual counterparts
 *
 * @param posts
 */
async function renderWeather(weather: WeatherItem): Promise<SaveCanvasObject> {
  return new Promise((resolve) => {
    const canvas = new Drawing(CANVAS_WIDTH);
    const limit = 4;

    const runner = async (idx: number) => {
      if (idx >= limit) {
        const { sunrise, sunset } = weather.daily[0];

        canvas.wrappedText(`${dayjs(sunrise * 1000).format('hh:mm')}`, canvas.columnWidth(1), {
          fontStyle: 'smallTitle',
        });
        canvas.resetLastHeight();

        canvas.rect(canvas.columnWidth(2), 2, {
          x: canvas.columnWidth(1, true),
          y: 9,
        });
        canvas.resetLastHeight();

        canvas.wrappedText(`${dayjs(sunset * 1000).format('hh:mm')}`, canvas.columnWidth(1), {
          fontStyle: 'smallTitle',
          align: 'right',
          x: canvas.columnWidth(3, true),
        });

        const imageObject = await canvas.saveCanvas();
        resolve(imageObject);
        return;
      }
      const item = weather.daily[idx];
      const firstWeather = item.weather.shift();

      const { dt, temp } = item;

      canvas.ctx.save();
      canvas.ctx.translate(canvas.columnWidth(idx, true), 0);

      canvas.wrappedText(idx === 0 ? 'Today' : dayjs(dt * 1000).format('ddd'), canvas.columnWidth(1), {
        fontStyle: 'smallTitle',
      });
      canvas.resetLastHeight();
      canvas.wrappedText(`${Math.round(temp.max)}°`, canvas.columnWidth(1), {
        align: 'right',
        fontStyle: 'smallTitle',
      });

      if (firstWeather) {
        await canvas.drawImage(weatherIcon(firstWeather.icon), canvas.columnWidth(1));
      }

      if (idx < 3) {
        canvas.resetLastHeight(2);
      }
      canvas.ctx.restore();

      runner(idx + 1);
    };

    runner(0);
  });
}

/**
 * Method that gets run to generate content and create pdf
 *
 * @param opts any
 */
function run(opts: WeatherOptions): Promise<SaveCanvasObject> {
  return getForecase(opts).then((daily) => {
    return renderWeather(daily);
  });
}

const Service: WeatherService = {
  name: SERVICES.WEATHER,
  run,
};

export default Service;
