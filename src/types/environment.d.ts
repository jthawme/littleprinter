declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEWS_API_KEY?: string;
      NODE_ENV: 'development' | 'production';
      OFFLINE: boolean;
      SAVE_OFFLINE?: boolean;
      WEATHER_API_KEY?: string;
      PRINTER_NAME: string;
      SINGLE_PRINT: boolean;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
