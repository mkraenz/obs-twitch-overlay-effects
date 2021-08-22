export const isProd = true; // manually set true for production
export const DEV = isProd
    ? {}
    : {
          enabled: true,
          dontConnectToTwitch: true,
          enableSceneWatcher: false,
      };
