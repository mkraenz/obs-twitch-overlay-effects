import { GameObjects, Scene } from "phaser";

const g = 9.81;
const x0 = 100;
const y0 = 500;

export class CannonShot extends Scene {
    private alpha = (Math.random() / 2) * Math.PI; // 0 to 90 degrees
    private v0 = 100;
    private circle!: GameObjects.Arc;
    private target!: GameObjects.Rectangle;
    private t = 0;

    constructor(key = "CannonShot") {
        super(key);
    }

    public create() {
        this.circle = this.add.circle(x0, y0, 10, 0xff0000);
        this.physics.add.existing(this.circle);
        this.target = this.add.rectangle(1000, y0, 100, 10, 0x00ff00);
        this.physics.add.existing(this.target);
        this.physics.add.collider(this.circle, this.target, () => {
            this.add.text(100, 100, "HIT!", {
                color: "#ff0000",
                fontSize: "48px",
            });
        });
    }

    update(timeSinceStart: number, delta: number): void {
        // x(t) = v0 * cos(alpha) * t
        // y(t) = v0 * sin(alpha) * t - 1/2 * g * t^2
        if (this.circle.y <= y0 + 1) {
            this.t += delta / 100;
            const xt = x0 + this.v0 * Math.cos(this.alpha) * this.t;
            const yt =
                y0 -
                (this.v0 * Math.sin(this.alpha) * this.t -
                    0.5 * g * Math.pow(this.t, 2));
            this.circle.setX(xt);
            this.circle.setY(yt);
        }
    }
}
