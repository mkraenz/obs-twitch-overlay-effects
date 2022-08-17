import { Types } from "phaser";
import { DEV } from "./dev-config";
import { MainScene } from "./scenes/MainScene";

interface IPlugin {
    key: string;
    plugin: any;
}
const isPlugin = (x: false | IPlugin): x is IPlugin => !!x;
const DebugPlugins = [
    !!DEV.enableSceneWatcher && {
        key: "SceneWatcher",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        plugin: require("phaser-plugin-scene-watcher"),
    },
].filter(isPlugin);

export const gameConfig: Types.Core.GameConfig = {
    scene: MainScene,
    type: Phaser.AUTO,
    dom: {
        createContainer: true,
    },
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        fullscreenTarget: "game",
        parent: "game",
        width: "100%",
        height: "100%",
    },
    transparent: true,
    plugins: {
        global: [...DebugPlugins],
    },
    callbacks: {
        postBoot: (game) => {
            if (DEV.enableSceneWatcher) {
                (game.plugins.get("SceneWatcher") as any).watchAll();
            }
        },
    },
};
