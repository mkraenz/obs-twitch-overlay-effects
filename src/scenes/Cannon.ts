import { GameObjects, Scene } from "phaser";

const x0 = 100;
const y0 = 500;
const minSpeed = 100;
const maxSpeed = 150;
const maxAngle = Math.PI / 2;
const angleStep = 0.0174 * 5; // roughly 1 degree in radians
const speedStep = 5;
const resetTime = 3000;

export const commands = [
    "!up",
    "!down",
    "!powerup",
    "!powerdown",
    "!shoot",
    "!gravityup",
    "!gravitydown",
] as const;
type Commands = typeof commands[number];

export class Cannon extends Scene {
    private g = 9.81;
    private angle = 0; // 0 to 90 degrees
    private speed = minSpeed;
    private ball!: GameObjects.Arc;
    private target!: GameObjects.Rectangle;
    private tFlying = 0;
    private state: "aiming" | "flying" = "aiming";
    private speedBar!: GameObjects.Rectangle;
    private resultText!: GameObjects.Text;
    private cannonPipe!: GameObjects.Image;

    constructor(key = "Cannon") {
        super(key);
    }

    public create() {
        this.ball = this.add.circle(x0, y0, 10, 0xff0000);
        this.physics.add.existing(this.ball);
        this.target = this.add.rectangle(1000, y0, 100, 10, 0x00ff00);
        this.physics.add.existing(this.target);
        this.physics.add.collider(this.ball, this.target, () => {
            this.resultText.setVisible(true);
        });
        this.resultText = this.add
            .text(100, 150, "HIT!", {
                color: "#ff0000",
                fontSize: "48px",
            })
            .setVisible(false);
        this.speedBar = this.add
            .rectangle(300, 50, 200, 48, 0x00ff00)
            .setOrigin(0, 0.5);
        this.cannonPipe = this.add
            .image(x0, y0 + 20 - 17, "cannon-pipe")
            .setFlipX(true)
            .setOrigin(0.5, 1)
            .setRotation(Math.PI / 2); // start lying
        this.add.image(x0, y0 - 17, "cannon-stand");
        this.redraw();
    }

    public handleMessage(command: Commands) {
        switch (command) {
            case "!up":
                this.angle = Math.min(this.angle + angleStep, maxAngle);
                break;
            case "!down":
                this.angle = Math.max(this.angle - angleStep, 0);
                break;
            case "!powerup":
                this.speed = Math.min(this.speed + speedStep, maxSpeed);
                break;
            case "!powerdown":
                this.speed = Math.max(this.speed - speedStep, minSpeed);
                break;
            case "!shoot":
                this.shoot();
                break;
            case "!gravityup":
                this.g += 3;
                break;
            case "!gravitydown":
                this.g -= 3;
                break;
        }
        this.redraw();
    }

    private shoot() {
        if (this.state === "aiming") this.state = "flying";
    }

    private redraw() {
        this.redrawBars();
        this.redrawPipe();
    }

    private redrawBars() {
        this.speedBar.setScale(
            (this.speed - minSpeed) / (maxSpeed - minSpeed),
            1
        );
    }

    private redrawPipe() {
        this.cannonPipe.setRotation(Math.PI / 2 - this.angle);
    }

    // https://de.wikipedia.org/wiki/Wurfparabel
    // x(t) = v0 * cos(alpha) * t
    // y(t) = v0 * sin(alpha) * t - 1/2 * g * t^2
    public update(timeSinceStart: number, delta: number): void {
        console.log(this.g);
        const inTheAir = this.ball.y <= y0 + 1;
        if (this.state === "flying" && inTheAir) {
            this.tFlying += delta / 100;
            const xt = x0 + this.speed * Math.cos(this.angle) * this.tFlying;
            const yt =
                y0 -
                (this.speed * Math.sin(this.angle) * this.tFlying -
                    0.5 * this.g * Math.pow(this.tFlying, 2));
            this.ball.setX(xt);
            this.ball.setY(yt);
        }

        const landed = this.ball.y >= y0 + 1;
        if (this.state === "flying" && landed)
            this.time.delayedCall(resetTime, () => this.reset());
    }

    private reset() {
        this.state = "aiming";
        this.resetBall();
    }

    private resetBall() {
        this.ball.setPosition(x0, y0);
        this.tFlying = 0;
        this.resultText.setVisible(false);
    }
}
