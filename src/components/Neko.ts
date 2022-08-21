import { random, sample } from "lodash";
import ms from "ms";
import { GameObjects, Scene, Types } from "phaser";

type AnimationKey =
    | "idle"
    | "laugh"
    | "walk"
    | "eyes"
    | "laugh"
    | "talk"
    | "oh"
    | "ohno";

type AnimationConfig = Omit<Types.Animations.PlayAnimationConfig, "key"> & {
    key: AnimationKey;
};

const anims = ["walk", "idle", "eyes", "laugh", "oh"] as const;
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
    private isInBlockingAnimation = false;

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
        this.playAnim({ key: "walk" });
        if (config?.viewDirection === "right") this.setFlipX(true);
    }

    public update(time: number, delta: number) {
        this.timeToNextAnim -= delta;
        if (!this.isInBlockingAnimation && this.timeToNextAnim < 0) {
            this.playAnim({ key: sample(anims)!, repeat: -1 });
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

        // const dlg = this.scene.add.nineslice(
        //     greeting.getCenter().x - 40,
        //     greeting.getCenter().y - 20, // this is the starting x/y location
        //     greeting.displayWidth + 40 * 2,
        //     greeting.displayHeight + 20 * 2, // the width and height of your object
        //     "textbox", // a key to an already loaded image
        //     24, // the width and height to offset for a corner slice
        //     2 // (optional) pixels to offset when computing the safe usage area
        // );
        // dlg.setOrigin(0.5, 0.5);
        // greeting.setText("");

        const to = fullstring.length;
        this.scene.tweens.addCounter({
            duration: Cfg.greetingAnimDuration,
            from: 0,
            to,
            onStart: () => {
                this.isInBlockingAnimation = true;
                this.playAnim({ key: "talk" });
            },
            onComplete: () => {
                this.isInBlockingAnimation = false;
                greeting.destroy();
            },
            onUpdate: (_, { value }: { value: number }) => {
                // dlg.setDisplaySize(
                //     greeting.getTopRight().x - greeting.getTopLeft().x - 40,
                //     dlg.displayHeight
                // );
                greeting.setText(fullstring.substring(0, Math.floor(value)));
                if (Math.ceil(value) === to) {
                    this.playAnim({ key: "idle" });
                }
            },
            hold: Cfg.greetingHoldDuration,
        });
    }

    public beShocked() {
        if (!this.isInBlockingAnimation) {
            const key = !!random(1) ? "ohno" : "oh";
            this.playBlockingAnim({ key, duration: 5000 });
        }
    }

    public laugh(): void {
        if (!this.isInBlockingAnimation) {
            this.playBlockingAnim({ key: "laugh", duration: 5000 });
        }
    }

    private playBlockingAnim(options: AnimationConfig & { duration: number }) {
        this.isInBlockingAnimation = true;
        this.playAnim(options);
        this.scene.time.delayedCall(options.duration, () => {
            this.isInBlockingAnimation = false;
        });
    }

    private playAnim(options: AnimationConfig) {
        this.play({ repeat: -1, ...options });
    }
}
