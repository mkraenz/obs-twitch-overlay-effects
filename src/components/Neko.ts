import { random, sample } from "lodash";
import ms from "ms";
import { GameObjects, Scene, Types } from "phaser";
import { setTextShadowMd, TextConfig } from "../styles/TextConfig";

type AnimationKey =
    | "idle"
    | "laugh"
    | "dance"
    | "eyes"
    | "talk"
    | "laptop"
    | "sit"
    | "sit-sherlock"
    | "blush"
    | "oh"
    | "confused"
    | "ohno";

type AnimationConfig = Omit<Types.Animations.PlayAnimationConfig, "key"> & {
    key: AnimationKey;
};

const anims: AnimationKey[] = [
    "idle",
    "laugh",
    "dance",
    "eyes",
    "laptop",
    "sit",
    "sit-sherlock",
    "blush",
];
const Cfg = {
    initialTimeToNextAnim: ms("5 second"),
    timeToNextAnimMin: ms("3 second"),
    timeToNextAnimMax: ms("20 seconds"),
    greetingAnimDuration: ms("2 seconds"),
    greetingHoldDuration: ms("5 seconds"),
    timeToNextCheezburgerMin: ms("1 hour"),
    timeToNextCheezburgerMax: ms("3 hours"),
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
    private timeToNextCheezburger = random(
        Cfg.timeToNextCheezburgerMin,
        Cfg.timeToNextCheezburgerMax
    );

    private isInBlockingAnimation = false;
    private lovesCheezburger = false;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        texture: "ao" | "midori" | "pink",
        config?: {
            viewDirection?: "right";
            /** default 3 */
            scale?: number;
            lovesCheezburger?: boolean;
        }
    ) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.anims.createFromAseprite(texture, undefined, this);
        this.setScale(config?.scale ?? 3);
        this.playAnim({ key: "dance" });
        if (config?.viewDirection === "right") this.setFlipX(true);

        this.lovesCheezburger = config?.lovesCheezburger || false;
    }

    public update(time: number, delta: number) {
        this.timeToNextAnim -= delta;
        this.timeToNextCheezburger -= delta;

        if (!this.isInBlockingAnimation && this.timeToNextAnim < 0) {
            this.playAnim({ key: sample(anims)!, repeat: -1 });
            this.timeToNextAnim = random(
                Cfg.timeToNextAnimMin,
                Cfg.timeToNextAnimMax
            );
        }

        if (
            this.lovesCheezburger &&
            !this.isInBlockingAnimation &&
            this.timeToNextCheezburger < 0
        ) {
            this.sayCheezburger();
            this.timeToNextCheezburger = random(
                Cfg.timeToNextCheezburgerMin,
                Cfg.timeToNextCheezburgerMax
            );
        }
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

    public sayHi(username?: string) {
        const fullstring = `${sample(greetings)!} ${username || "Twitch"}!`;
        this.say(fullstring);
    }

    public sayGoodbye() {
        const fullstring = `Until next time, hoomanz!`;
        this.say(fullstring, { autoRemove: false });
    }

    public sayGoodbyeTo(displayName: string) {
        this.say(`See you next time, ${displayName}.`);
    }

    public sayCheezburger() {
        this.say("I Can Has Cheezburger?");
    }

    public sayIUseArchBtw() {
        this.say("I use Arch btw", { key: "laptop", keyEnd: "laptop" });
    }

    private playBlockingAnim(options: AnimationConfig & { duration: number }) {
        this.isInBlockingAnimation = true;
        this.playAnim(options);
        this.scene.time.delayedCall(options.duration, () => {
            this.isInBlockingAnimation = false;
        });
    }

    public beConfused() {
        this.playBlockingAnim({
            key: "confused",
            duration: 10000,
        });
    }

    private say(
        phrase: string,
        options?: {
            autoRemove?: boolean;
            key?: AnimationKey;
            keyEnd?: AnimationKey;
        }
    ) {
        const {
            autoRemove = true,
            key = "talk",
            keyEnd = "idle",
        } = options || {};
        const text = this.scene.add
            .text(this.x, this.y - 200, "", TextConfig.text)
            .setOrigin(0.5, 0);
        setTextShadowMd(text);

        const to = phrase.length;
        this.scene.tweens.addCounter({
            duration: Cfg.greetingAnimDuration,
            from: 0,
            to,
            onStart: () => {
                this.isInBlockingAnimation = true;
                this.playAnim({ key });
            },
            onComplete: () => {
                this.isInBlockingAnimation = false;
                if (autoRemove) text.destroy();
            },
            onUpdate: (_, { value }: { value: number }) => {
                text.setText(phrase.substring(0, Math.floor(value)));
                if (Math.ceil(value) === to) {
                    this.playAnim({ key: keyEnd });
                }
            },
            hold: Cfg.greetingHoldDuration,
        });
    }

    private playAnim(options: AnimationConfig) {
        this.play({ repeat: -1, ...options });
    }
}
