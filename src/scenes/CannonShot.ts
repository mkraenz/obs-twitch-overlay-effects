import { GameObjects, Scene } from "phaser";

const g = 9.81;
const x0 = 100;
const y0 = 500;
const minV0 = 100;
const maxV0 = 200;

export class CannonShot extends Scene {
    private currentPlayer: string | null = null;
    private alpha = (Math.random() / 2) * Math.PI; // 0 to 90 degrees
    private speed = 100;
    private circle!: GameObjects.Arc;
    private target!: GameObjects.Rectangle;
    private t = 0;
    private state: "not started" | "aiming" | "flying" | "landed" | "finished" =
        "not started";
    private fired = false;
    private speedText!: GameObjects.Text;
    private alphaText!: GameObjects.Text;

    constructor(key = "CannonShot") {
        super(key);
    }

    public create() {
        this.circle = this.add.circle(x0, y0, 10, 0xff0000);
        this.physics.add.existing(this.circle);
        this.target = this.add.rectangle(1000, y0, 100, 10, 0x00ff00);
        this.physics.add.existing(this.target);
        this.physics.add.collider(this.circle, this.target, () => {
            this.add.text(100, 150, "HIT!", {
                color: "#ff0000",
                fontSize: "48px",
            });
        });
        this.speedText = this.add.text(100, 50, "Speed", {
            color: "#ff0000",
            fontSize: "48px",
        });
        this.alphaText = this.add.text(100, 100, "Angle", {
            color: "#ff0000",
            fontSize: "48px",
        });
    }

    public get isAiming() {
        return this.currentPlayer !== null && !this.fired;
    }

    public get gameOngoing() {
        return this.currentPlayer !== null;
    }

    public startGame(player: string) {
        this.currentPlayer = player;
    }

    public fire() {
        this.fired = true;
    }

    // https://de.wikipedia.org/wiki/Wurfparabel
    // x(t) = v0 * cos(alpha) * t
    // y(t) = v0 * sin(alpha) * t - 1/2 * g * t^2
    public update(timeSinceStart: number, delta: number): void {
        if (this.isAiming) {
            this.speed = ((this.speed + 1) % (maxV0 - minV0)) + minV0;
            this.alpha = (this.alpha + 0.01) % (Math.PI / 2);
            this.alphaText.setText(`Angle: ${this.alpha}`);
            this.speedText.setText(`Speed: ${this.speed}`);
        }

        const inTheAir = this.circle.y <= y0 + 1;
        if (this.fired && inTheAir) {
            this.t += delta / 100;
            const xt = x0 + this.speed * Math.cos(this.alpha) * this.t;
            const yt =
                y0 -
                (this.speed * Math.sin(this.alpha) * this.t -
                    0.5 * g * Math.pow(this.t, 2));
            this.circle.setX(xt);
            this.circle.setY(yt);
        }
    }
}
