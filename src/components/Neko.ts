import { random, sample } from "lodash";
import { GameObjects, Scene } from "phaser";

const ssample = (array: string[]) => sample(array)!;

const anims = ["walk", "idle", "eyes", "laugh"];
const Cfg = {
    // TODO change to sth more reasonable
    initialTimeToNextAnim: 1000,
    timeToNextAnimMin: 1000,
    timeToNextAnimMax: 5000,
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
        }
    ) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.anims.createFromAseprite(texture, undefined, this);
        this.setScale(3);
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
