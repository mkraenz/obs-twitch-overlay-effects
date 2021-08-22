import { GUI } from "dat.gui";
import { Scene } from "phaser";
import { ChatUserstate, Client } from "tmi.js";
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

export class MainScene extends Scene {
    private tmiClient!: Client;
    private gui!: GUI;

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
            .text("starshower-effect", "assets/particles/starshower.json");
    }

    public create(): void {
        this.tmiClient = new Client(tmiConfig);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        if (DEV.dontConnectToTwitch) this.tmiClient.connect();
        this.tmiClient.on("message", this.handleMessage.bind(this));

        this.gui = new GUI();
        this.gui.hide();
        if (DEV.enabled) {
            this.gui.show();
            this.cameras.main.setBackgroundColor("#1E1E1E");
            this.gui.add(this, "emitHellFires");
            this.gui.add(this, "emitStarshower");
            this.gui.add(this, "slash");
        }
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
        if (!username || banned.includes(username)) return;
        const msg = message.toLowerCase();

        if (msg.includes("!fire")) return this.emitHellFires();

        if (
            msg.includes("!star") ||
            msg.includes("!starshower") ||
            msg.includes("!stars")
        ) {
            return this.emitStarshower();
        }

        if (msg.includes("!slash") || msg.includes("!slice"))
            return this.slash();
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
}
