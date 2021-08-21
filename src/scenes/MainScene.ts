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

        if (msg.includes("!fire")) {
            const emitter = this.makeEmitter("fire-effect");
            this.time.delayedCall(oneMinute, () => emitter.destroy());
            return;
        }
        if (
            msg.includes("!star") ||
            msg.includes("!starshower") ||
            msg.includes("!stars")
        ) {
            const emitter = this.makeEmitter("starshower-effect");
            this.time.delayedCall(oneMinute, () => emitter.destroy());
            return;
        }
    }
}
