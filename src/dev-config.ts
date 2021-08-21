// TODO make dev easy again
export const isProd = window.location.hostname !== "localhost";
export const DEV = isProd
    ? {}
    : {
          dontConnectToTwitch: true,
          enableSceneWatcher: false,
      };
