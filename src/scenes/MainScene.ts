import { GUI } from "dat.gui";
import { random, sample } from "lodash";
import ms from "ms";
import { Scene } from "phaser";
import { ChatUserstate, Client } from "tmi.js";
import { ChatterTracker } from "../components/ChatterTracker";
import { DiceRoll } from "../components/DiceRoll";
import { Neko } from "../components/Neko";
import { DEV } from "../dev-config";
import { Cannon, cannonCommands } from "./Cannon";
import { Scenes } from "./Scenes";

const tmiConfig = {
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true,
    },
    channels: ["typescriptteatime"],
};

const banned = ["streamelements"];

let otherStaticPaths: {
    familyGuyCssGif: string;
};

export class MainScene extends Scene {
    private tmiClient!: Client;
    private gui!: GUI;
    private cats: Neko[] = [];
    private chatterTracker!: ChatterTracker;
    private cannon!: Cannon;

    public constructor() {
        super({
            key: Scenes.Main,
        });
    }

    public preload() {
        this.load
            .atlas("shapes", "particles/shapes.png", "particles/shapes.json")
            .text("fire-effect", "particles/fire-at-bottom.json")
            .text("starshower-effect", "particles/starshower.json")
            .audio("fanfare", "sounds/teawars-fanfare.mp3")
            .audio("diceroll", "sounds/diceroll.mp3")
            .audio("oh-yeah", "sounds/oh-yeah.mp3")
            .aseprite({
                key: "ao",
                textureURL: "images/ao.png",
                atlasURL: "images/ao.json",
            })
            .aseprite({
                key: "pink",
                textureURL: "images/pink.png",
                atlasURL: "images/ao.json",
            })
            .aseprite({
                key: "midori",
                textureURL: "images/midori.png",
                atlasURL: "images/ao.json",
            });
        otherStaticPaths = {
            familyGuyCssGif: "images/family-guy-css.gif",
        };
    }

    public create(): void {
        this.tmiClient = new Client(tmiConfig);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        if (!DEV.dontConnectToTwitch) this.tmiClient.connect();
        this.tmiClient.on("message", this.handleMessage.bind(this));

        this.addCats();
        this.chatterTracker = new ChatterTracker(this.cats);
        this.cannon = this.scene.add("Cannon", Cannon, true) as Cannon;

        this.gui = new GUI();
        this.gui.hide();
        if (DEV.enabled) {
            this.gui.show();
            // this.cameras.main.setBackgroundColor("#1E1E1E");
            this.gui.add(this, "emitHellFires");
            this.gui.add(this, "emitStarshower");
            this.gui.add(this, "slash");
            this.gui.add(this, "addCssFamilyGuy");
            this.gui.add(this, "playFanfare");
            this.gui.add(this, "debugRollDice");
            this.gui.add(this, "debugSayHi");
            const aoGui = this.gui.addFolder("Neko");
            aoGui.add(this.cats[0], "beShocked");
            aoGui.add(this.cats[0], "sayGoodbye");
            aoGui.add(this.cats[0], "sayIUseArchBtw");
            aoGui.add(this.cats[1], "beConfused");
            const tstt = "TypeScriptTeatime";
            const cannonController = {
                up: () => this.cannon.handleMessage("!up", tstt),
                down: () => this.cannon.handleMessage("!down", tstt),
                gravityup: () => this.cannon.handleMessage("!gravityup", tstt),
                gravitydown: () =>
                    this.cannon.handleMessage("!gravitydown", tstt),
                powerup: () => this.cannon.handleMessage("!powerup", tstt),
                powerdown: () => this.cannon.handleMessage("!powerdown", tstt),
                shoot: () => this.cannon.handleMessage("!shoot", tstt),
            };
            const cannonFolder = this.gui.addFolder("Cannon");
            cannonFolder.open();
            cannonFolder.add(cannonController, "gravityup");
            cannonFolder.add(cannonController, "gravitydown");
            cannonFolder.add(cannonController, "up");
            cannonFolder.add(cannonController, "down");
            cannonFolder.add(cannonController, "powerup");
            cannonFolder.add(cannonController, "powerdown");
            cannonFolder.add(cannonController, "shoot");
        }
    }

    public update(time: number, delta: number) {
        this.cats.forEach((c) => c.update(time, delta));
    }

    private addCats() {
        this.cats.push(
            new Neko(
                this,
                this.scale.width / 2 + 150,
                this.scale.height - 132 - 30,
                "ao",
                { viewDirection: "right" }
            ),
            new Neko(
                this,
                this.scale.width / 2 + 260,
                this.scale.height - 150 - 30,
                "midori",
                { scale: 2.9, lovesCheezburger: true }
            ),
            new Neko(
                this,
                this.scale.width / 2 + 350,
                this.scale.height - 130 - 30,
                "pink"
            )
        );
    }

    private slash() {
        const shape = this.make
            .graphics({
                x: 0,
                y: -1500,
            })
            .fillRect(0, 0, this.scale.width, 1500);
        const mask = shape.createGeometryMask();
        // mask.setInvertAlpha();
        const slash = this.add.image(
            this.scale.width / 2,
            300,
            "shapes", // TODO less pixelated asset
            "slash_03"
        );
        slash
            .setRotation(Phaser.Math.TAU / 4)
            .setScale(10)
            .setMask(mask);

        const timeline = this.tweens.createTimeline();
        timeline.add({
            targets: [shape],
            y: 0,
            duration: 400,
        });
        timeline.add({
            delay: 500,
            targets: [shape],
            y: 1500,
            duration: 400,
        });
        timeline.play();
    }

    private makeEmitter(key: string) {
        return this.add.particles(
            "shapes",
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            new Function(`return ${this.cache.text.get(key) as string}`)()
        );
    }

    private handleMessage(
        channel: string,
        tags: ChatUserstate,
        message: string,
        self: boolean
    ) {
        if (self) return; // Ignore message by chatbot itself

        const username = tags.username;
        const displayName = tags["display-name"];
        if (!username || banned.includes(username)) return;
        const msg = message.toLowerCase();

        this.chatterTracker.handleChatMessage(msg, username, displayName);

        if (msg.includes("!fire")) return this.emitHellFires();

        if (
            msg.includes("!star") ||
            msg.includes("!stars") ||
            msg.includes("!starshower") ||
            msg.includes("!ice") ||
            msg.includes("!snow")
        ) {
            return this.emitStarshower();
        }
        if (msg.includes("!fanfare")) {
            return this.playFanfare();
        }

        const cannonballCommand = cannonCommands.find((cmd) =>
            msg.startsWith(cmd)
        );
        if (cannonballCommand) {
            this.cannon.handleMessage(
                cannonballCommand,
                displayName || username
            );
        }

        if (msg.includes("!slash") || msg.includes("!slice"))
            return this.slash();

        if (msg.includes("!css")) {
            return this.addCssFamilyGuy();
        }

        if (msg.includes("!ohyeah")) {
            return this.sound.play("oh-yeah", { volume: 0.2 });
        }

        if (msg.includes("!cheezburger")) {
            this.cats[1].sayCheezburger();
        }

        /** TODO for whatever reason OBS doesn't work with this, even when triggered from dat.GUI */
        if (
            msg.includes("!?") ||
            msg.includes("?!") ||
            msg.includes("!question") ||
            msg.includes("!confused")
        ) {
            // don't confuse ao because she's flipped and the questionmarks would render weirdly
            this.cats[random(1, 2)].beConfused();
        }

        if (msg.includes("!btw") || msg.includes("!arch")) {
            sample(this.cats)!.sayIUseArchBtw();
        }

        if (
            username === "typescriptteatime" &&
            (msg === "!bb" || msg === "!bye" || msg === "!goodbye")
        ) {
            this.cats[1].sayGoodbye();
        }

        if (/^!roll [1-9]\d*$/.test(msg)) {
            return this.rollDice(msg);
        }
    }

    private addCssFamilyGuy() {
        const animationDuration = 18600;
        const familyGuy = document.createElement("img");
        familyGuy.src = otherStaticPaths.familyGuyCssGif;
        familyGuy.width = 250;
        familyGuy.setAttribute(
            "style",
            "position: absolute; top: 50px; left: 50px;"
        );
        const element = document.body.appendChild(familyGuy);
        this.time.delayedCall(animationDuration, () => element.remove());
    }

    private playFanfare() {
        this.sound.stopAll();
        this.sound.play("fanfare", { volume: 0.5 });
    }

    private emitHellFires() {
        const emitter = this.makeEmitter("fire-effect");

        if (DEV.enabled) emitter.setY(-80); // not in fullscreen in dev

        this.time.delayedCall(ms("1 minute"), () => emitter.destroy());
    }

    private emitStarshower() {
        const emitter = this.makeEmitter("starshower-effect");
        this.time.delayedCall(ms("1 minute"), () => emitter.destroy());
    }

    /** @example diceRoll('!roll 100') roles a d100 */
    private rollDice(msg: string) {
        new DiceRoll(this, msg);
    }

    private debugRollDice() {
        this.rollDice("!roll 20");
    }

    private debugSayHi() {
        this.cats[0].sayHi("TypeScriptTeatime");
    }
}
