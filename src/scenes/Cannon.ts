import { GameObjects, Scene, Types } from "phaser";

const x0 = 100;
const y0 = 500;
const minSpeed = 250;
const maxSpeed = 700;
const maxAngle = Math.PI / 2;
const angleStep = 0.0174 * 5; // roughly 1 degree in radians
const speedStep = 50;
const resetTime = 3000;

export const cannonCommands = [
    "!up",
    "!down",
    "!powerup",
    "!powerdown",
    "!shoot",
    "!gravityup",
    "!gravitydown",
] as const;
type Commands = typeof cannonCommands[number];

export class Cannon extends Scene {
    private angle = 0; // 0 to 90 degrees
    private speed = minSpeed;
    // TODO multiple cannonballs
    private ball!: Types.Physics.Arcade.ImageWithDynamicBody;
    private target!: GameObjects.Rectangle;
    private state: "aiming" | "flying" = "aiming";
    private speedBar!: GameObjects.Rectangle;
    private resultText!: GameObjects.Text;
    private cannonPipe!: GameObjects.Image;

    constructor(key = "Cannon") {
        super(key);
    }

    public create() {
        this.physics.world.gravity.y = 98.1;
        // do not collide with top
        this.physics.world.setBoundsCollision(true, true, false, true);
        this.ball = this.physics.add
            .image(x0, y0, "cannonball")
            .setScale(0.4)
            .setCollideWorldBounds(true, 0.5, 0.5);
        this.ball.body.setAllowGravity(false);
        this.target = this.add.rectangle(1000, y0, 100, 10, 0x00ff00);
        this.physics.add.existing(this.target, true);
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
            .setRotation(Math.PI / 2); // start lying flat
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
                this.increaseGravityY(3);
                break;
            case "!gravitydown":
                this.increaseGravityY(-3);
                break;
        }
        this.redraw();
    }

    private increaseGravityY(amount: number) {
        this.physics.world.gravity.y += amount;
    }

    private shoot() {
        if (this.state === "aiming") {
            this.state = "flying";
            const v = new Phaser.Math.Vector2(this.speed, 0);
            v.setAngle(-this.angle);
            this.ball.setVelocity(v.x, v.y);
            this.ball.body.setAllowGravity(true);
        }
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

    public update(): void {
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
        this.ball.body.setAllowGravity(false);
        this.ball.setVelocity(0);
        this.resultText.setVisible(false);
    }
}
