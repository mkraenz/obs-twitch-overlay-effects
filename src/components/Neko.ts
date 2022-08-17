import { random, sample } from "lodash";
import { GameObjects, Scene } from "phaser";
import ms = require("ms");

const anims = ["walk", "idle", "eyes", "laugh"] as const;
const specialAnims = ["talk"] as const;
const Cfg = {
    initialTimeToNextAnim: ms("5 second"),
    timeToNextAnimMin: ms("1 second"),
    timeToNextAnimMax: ms("5 seconds"),
    greetingAnimDuration: ms("2 seconds"),
    greetingHoldDuration: ms("5 seconds"),
};

const greetings = [
    "Hi",
    "Hey",
    "Heya",
    "Hello",
    "Howdy",
    "Welcome",
    "Greetings",
    "Kon'nichiha",
] as const;

export class Neko extends GameObjects.Sprite {
    private timeToNextAnim = Cfg.initialTimeToNextAnim;
    private isInSpecialAnimation = false;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        texture: "ao" | "midori" | "pink",
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
        if (!this.isInSpecialAnimation && this.timeToNextAnim < 0) {
            this.play({ key: sample(anims)!, repeat: -1 });
            this.timeToNextAnim = random(
                Cfg.timeToNextAnimMin,
                Cfg.timeToNextAnimMax
            );
        }
    }

    public sayHi(username?: string) {
        const fullstring = `${sample(greetings)!} ${username || "Twitch"}!`;
        const greeting = this.scene.add
            .text(this.x, this.y - 200, "", {
                fontFamily: "PressStart2P",
                fontSize: "32px",
                color: "white",
            })
            .setOrigin(0.5, 0);
        greeting.setStroke("black", 16);
        greeting.setShadow(2, 2, "#333333", 2, false, false);

        const to = fullstring.length;
        this.scene.tweens.addCounter({
            duration: Cfg.greetingAnimDuration,
            from: 0,
            to,
            onStart: () => {
                this.isInSpecialAnimation = true;
                this.play({ key: specialAnims[0], repeat: -1 });
            },
            onComplete: () => {
                this.isInSpecialAnimation = false;
                greeting.destroy();
            },
            onUpdate: (_, { value }: { value: number }) => {
                console.log("value", value);
                greeting.setText(fullstring.substring(0, Math.floor(value)));
                if (Math.ceil(value) === to) {
                    this.play({ key: "idle" });
                }
            },
            hold: Cfg.greetingHoldDuration,
        });
    }
}
