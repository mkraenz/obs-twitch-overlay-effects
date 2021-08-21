import { Scene } from "phaser";
import { Scenes } from "./Scenes";

const cfg = {
    screenHeight: 1080,
};

export class MainScene extends Scene {
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
            .text("fire-effect", "assets/particles/fire-at-bottom.json");
    }

    public create(): void {
        // this.cameras.main.setBackgroundColor(Color.Black);

        const emitter = this.add.particles(
            "shapes",
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            new Function(
                `return ${this.cache.text.get("fire-effect") as string}`
            )()
        );
        emitter.setDepth(9999999);
        emitter.setY(cfg.screenHeight);
    }
}
