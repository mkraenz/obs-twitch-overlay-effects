const port = location.host.split(":")[1];
export const isProd = port === "8765"; // manually set true for production
console.log(`Running in ${isProd ? "production" : "development"} mode`);
export const DEV = isProd
    ? {}
    : {
          enabled: true,
          dontConnectToTwitch: true,
          enableSceneWatcher: false,
      };
