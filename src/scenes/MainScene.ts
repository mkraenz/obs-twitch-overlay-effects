import { GUI } from "dat.gui";
import { Scene } from "phaser";
import { ChatUserstate, Client } from "tmi.js";
import { ChatterTracker } from "../components/ChatterTracker";
import { DiceRoll } from "../components/DiceRoll";
import { Neko } from "../components/Neko";
import { DEV } from "../dev-config";
import { Scenes } from "./Scenes";

const oneMinute = 60000;

const cfg = {};

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

    public constructor() {
        super({
            key: Scenes.Main,
        });
    }

    public preload() {
        this.load
            .atlas(
                "shapes",
                "assets/particles/shapes.png",
                "assets/particles/shapes.json"
            )
            .text("fire-effect", "assets/particles/fire-at-bottom.json")
            .text("starshower-effect", "assets/particles/starshower.json")
            // .image("textbox", "assets/images/textbox.png")
            .audio("fanfare", "assets/sounds/teawars-fanfare.mp3")
            .audio("diceroll", "assets/sounds/diceroll.mp3")
            .aseprite({
                key: "ao",
                textureURL: "assets/images/ao.png",
                atlasURL: "assets/images/ao.json",
            })
            .aseprite({
                key: "pink",
                textureURL: "assets/images/pink.png",
                atlasURL: "assets/images/ao.json",
            })
            .aseprite({
                key: "midori",
                textureURL: "assets/images/midori.png",
                atlasURL: "assets/images/ao.json",
            });
        otherStaticPaths = {
            familyGuyCssGif: "assets/images/family-guy-css.gif",
        };
    }

    public create(): void {
        this.tmiClient = new Client(tmiConfig);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        if (!DEV.dontConnectToTwitch) this.tmiClient.connect();
        this.tmiClient.on("message", this.handleMessage.bind(this));

        this.addCats();
        this.chatterTracker = new ChatterTracker(this.cats);

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
            this.gui.addFolder("Ao").add(this.cats[0], "beShocked");
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
                { scale: 2.9 }
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

        this.chatterTracker.UpsertChatter(displayName || username);
        this.chatterTracker.handleChatMessage(msg);

        if (msg.includes("!fire")) return this.emitHellFires();

        if (
            msg.includes("!star") ||
            msg.includes("!starshower") ||
            msg.includes("!stars") ||
            msg.includes("!ice")
        ) {
            return this.emitStarshower();
        }
        if (msg.includes("!fanfare")) {
            return this.playFanfare();
        }

        if (msg.includes("!slash") || msg.includes("!slice"))
            return this.slash();

        if (msg.includes("!css")) {
            return this.addCssFamilyGuy();
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
            "position: absolute; top: 50; left: 50;"
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

        this.time.delayedCall(oneMinute, () => emitter.destroy());
    }

    private emitStarshower() {
        const emitter = this.makeEmitter("starshower-effect");
        this.time.delayedCall(oneMinute, () => emitter.destroy());
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
