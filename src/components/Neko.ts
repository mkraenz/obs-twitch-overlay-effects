import { random, sample } from "lodash";
import { GameObjects, Scene } from "phaser";
import ms = require("ms");

const ssample = (array: string[]) => sample(array)!;

const anims = ["walk", "idle", "eyes", "laugh"];
const Cfg = {
    initialTimeToNextAnim: ms("5 second"),
    timeToNextAnimMin: ms("1 second"),
    timeToNextAnimMax: ms("5 seconds"),
};

export class Neko extends GameObjects.Sprite {
    private timeToNextAnim = Cfg.initialTimeToNextAnim;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        texture: "aoi" | "midori" | "pink",
        config?: {
            viewDirection?: "right";
            /** default 3 */
            scale?: number;
        }
    ) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.anims.createFromAseprite(texture, undefined, this);
        this.setScale(config?.scale ?? 3);
        this.play({ key: "walk", repeat: -1 });
        if (config?.viewDirection === "right") this.setFlipX(true);
    }

    public update(time: number, delta: number) {
        this.timeToNextAnim -= delta;
        if (this.timeToNextAnim < 0) {
            this.play({ key: ssample(anims), repeat: -1 });
            this.timeToNextAnim = random(
                Cfg.timeToNextAnimMin,
                Cfg.timeToNextAnimMax
            );
        }
    }
}
