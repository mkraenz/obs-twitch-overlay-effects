import { GameObjects, Scene } from "phaser";

const g = 9.81;
const x0 = 100;
const y0 = 500;
const minSpeed = 100;
const maxSpeed = 150;
const maxAngle = Math.PI / 2;

export class CannonShot extends Scene {
    private currentPlayer: string | null = null;
    private angle = 0; // 0 to 90 degrees
    private speed = minSpeed;
    private circle!: GameObjects.Arc;
    private target!: GameObjects.Rectangle;
    private t = 0;
    private state: "not started" | "aiming" | "flying" | "landed" | "finished" =
        "not started";
    private speedText!: GameObjects.Text;
    private angleText!: GameObjects.Text;
    private angleBar!: GameObjects.Rectangle;
    private speedBar!: GameObjects.Rectangle;
    private resultText!: GameObjects.Text;

    constructor(key = "CannonShot") {
        super(key);
    }

    public create() {
        this.circle = this.add.circle(x0, y0, 10, 0xff0000);
        this.physics.add.existing(this.circle);
        this.target = this.add.rectangle(1000, y0, 100, 10, 0x00ff00);
        this.physics.add.existing(this.target);
        this.physics.add.collider(this.circle, this.target, () => {
            this.resultText.setVisible(true);
        });
        this.resultText = this.add
            .text(100, 150, "HIT!", {
                color: "#ff0000",
                fontSize: "48px",
            })
            .setVisible(false);
        this.speedText = this.add
            .text(100, 50, "Speed", {
                color: "#ff0000",
                fontSize: "48px",
            })
            .setOrigin(0, 0.5);
        this.angleText = this.add
            .text(100, 100, "Angle", {
                color: "#ff0000",
                fontSize: "48px",
            })
            .setOrigin(0, 0.5);
        this.speedBar = this.add
            .rectangle(300, 50, 200, 48, 0x00ff00)
            .setOrigin(0, 0.5);
        this.angleBar = this.add
            .rectangle(300, 100, 200, 48, 0x00ff00)
            .setOrigin(0, 0.5);
    }

    public startGame(player: string) {
        this.currentPlayer = player;
        this.state = "aiming";
    }

    public handleMessage(displayName: string) {
        if (this.state === "not started" || this.state === "finished") {
            return this.startGame(displayName);
        }
        if (this.currentPlayer !== displayName) {
            // not the current player this ignore command
            return;
        }
        if (this.state === "aiming") {
            return this.fire();
        }
    }

    public fire() {
        this.state = "flying";
    }

    private updateBars() {
        this.speed = ((this.speed + 1) % (maxSpeed - minSpeed)) + minSpeed;
        this.angle = (this.angle + 0.01) % (Math.PI / 2);
        this.angleBar.setScale(this.angle / maxAngle, 1);
        this.speedBar.setScale(
            (this.speed - minSpeed) / (maxSpeed - minSpeed),
            1
        );
    }
    // https://de.wikipedia.org/wiki/Wurfparabel
    // x(t) = v0 * cos(alpha) * t
    // y(t) = v0 * sin(alpha) * t - 1/2 * g * t^2
    public update(timeSinceStart: number, delta: number): void {
        if (this.state === "aiming") {
            this.updateBars();
            // this.angleText.setText(`Angle ${this.angle}`);
            // this.speedText.setText(`Speed ${this.speed}`);
        }

        const inTheAir = this.circle.y <= y0 + 1;
        if (this.state === "flying" && inTheAir) {
            this.t += delta / 100;
            const xt = x0 + this.speed * Math.cos(this.angle) * this.t;
            const yt =
                y0 -
                (this.speed * Math.sin(this.angle) * this.t -
                    0.5 * g * Math.pow(this.t, 2));
            this.circle.setX(xt);
            this.circle.setY(yt);
        }
        const landed = this.circle.y >= y0 + 1;

        if (this.state === "flying" && landed) {
            this.state = "landed";
            // TODO: show winner
            this.time.delayedCall(7000, () => {
                this.state = "finished";
                this.resetValues();
            });
        }
    }

    public resetValues() {
        this.circle.setPosition(x0, y0);
        this.t = 0;
        this.angle = 0;
        this.speed = minSpeed;
        this.resultText.setVisible(false);
        this.angleBar.setScale(1);
        this.speedBar.setScale(1);
    }
}
