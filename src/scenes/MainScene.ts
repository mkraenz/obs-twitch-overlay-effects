import { GUI } from "dat.gui";
import ms from "ms";
import { Scene } from "phaser";
import { ChatUserstate, Client } from "tmi.js";
import { ChatterTracker } from "../components/ChatterTracker";
import { DiceRoll } from "../components/DiceRoll";
import { Neko } from "../components/Neko";
import { DEV } from "../dev-config";
import { CannonShot } from "./CannonShot";
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
    private cannonShot!: CannonShot;

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
        this.cannonShot = this.scene.add(
            "CannonShot",
            CannonShot,
            true
        ) as CannonShot;

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
            const aoGui = this.gui.addFolder("Ao");
            aoGui.add(this.cats[0], "beShocked");
            aoGui.add(this.cats[0], "sayGoodbye");
            this.gui.add(this.cannonShot, "fire").name("Fire Cannon");
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
                this.scale.height - 132,
                "ao",
                { viewDirection: "right" }
            ),
            new Neko(
                this,
                this.scale.width / 2 + 260,
                this.scale.height - 150,
                "midori",
                { scale: 2.9, lovesCheezburger: true }
            ),
            new Neko(
                this,
                this.scale.width / 2 + 350,
                this.scale.height - 130,
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

        if (msg.includes("!cannon")) {
            if (!this.cannonShot.gameOngoing) {
                return this.cannonShot.startGame(username);
            }
            if (this.cannonShot.isAiming) {
                return this.cannonShot.fire();
            }
        }

        if (msg.includes("!slash") || msg.includes("!slice"))
            return this.slash();

        if (msg.includes("!css")) {
            return this.addCssFamilyGuy();
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
