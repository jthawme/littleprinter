declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEWS_API_KEY?: string;
      NODE_ENV: 'development' | 'production';
      OFFLINE: boolean;
      SAVE_OFFLINE?: boolean;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
