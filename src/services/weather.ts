import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

import { GeneralObject } from './types/base';
import { Drawing, SaveCanvasObject } from '../utils/drawing';
import { getOfflineData, saveOfflineData } from '../utils/offline';
import { WeatherService, WeatherOptions, WeatherItem } from './types/weather';

/**
 * Returns the prefixed route
 *
 * @param route
 */
function weatherApi(route: string): string {
  return `https://api.openweathermap.org/data/2.5${route}`;
}

function weatherIcon(icon: string, size = 4): string {
  return `http://openweathermap.org/img/wn/${icon}@${size}x.png`;
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
    const canvas = new Drawing(400);
    const limit = 4;

    const runner = async (idx: number) => {
      if (idx >= limit) {
        const imageObject = await canvas.saveCanvas({ paddingTop: 20, paddingBottom: 30 });
        resolve(imageObject);
        return;
      }
      const item = weather.daily[idx];

      const firstWeather = item.weather.shift();

      canvas.ctx.font = `bold ${idx === 0 ? 15 : 11}px Helvetica`;
      canvas.wrappedText(dayjs(item.dt * 1000).format('ddd D MMM'), canvas.width * 0.4, {
        x: canvas.width * 0.1,
      });

      if (firstWeather) {
        const { height: iconHeight } = await canvas.drawImage(
          weatherIcon(firstWeather.icon, idx === 0 ? 4 : 2),
          idx === 0 ? canvas.width * 0.5 : canvas.width * 0.1,
          { x: idx === 0 ? 0 : canvas.width * 0.1 },
        );
        canvas.resetLastHeight();

        canvas.ctx.font = `bold ${idx === 0 ? 32 : 14}px Helvetica`;

        const { emHeightDescent, emHeightAscent } = canvas.ctx.measureText(firstWeather.main);

        const topHeight = Math.max(iconHeight, emHeightAscent + emHeightDescent);

        canvas.wrappedText(firstWeather.main, undefined, {
          x: canvas.width * 0.5,
          y: iconHeight * (idx === 0 ? 0.3 : 0),
        });
        canvas.resetLastHeight();

        canvas.ctx.font = `bold ${idx === 0 ? 21 : 11}px Helvetica`;
        canvas.wrappedText(`${Math.round(item.temp.max)}°C / ${Math.round(item.temp.min)}°C`, undefined, {
          x: canvas.width * 0.5,
          y: iconHeight * (idx === 0 ? 0.3 : 0) + (emHeightAscent + emHeightDescent) * 1.2,
        });
        canvas.resetLastHeight();
        canvas.pad(topHeight);
      }

      if (idx === 0) {
        canvas.rect(canvas.width, 1);
        canvas.pad(10);

        canvas.ctx.font = 'bold 15px Helvetica';
        canvas.wrappedText(`Sunrise`, canvas.width * 0.4, {
          x: canvas.width * 0.1,
        });
        canvas.resetLastHeight();
        canvas.wrappedText(`Sunset`, canvas.width * 0.4, {
          x: canvas.width * 0.5,
        });

        canvas.ctx.font = 'bold 21px Helvetica';
        canvas.wrappedText(dayjs(item.sunrise * 1000).format('h:mm'), canvas.width * 0.4, {
          x: canvas.width * 0.1,
        });
        canvas.resetLastHeight();
        canvas.wrappedText(dayjs(item.sunset * 1000).format('h:mm'), canvas.width * 0.4, {
          x: canvas.width * 0.5,
        });

        canvas.pad(10);
        canvas.rect(canvas.width, 1);
      }

      canvas.pad(idx === 0 ? 10 : 4);

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
  name: 'Weather Service',
  run,
};

export default Service;
