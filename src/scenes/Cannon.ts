import { random } from "lodash";
import ms from "ms";
import { GameObjects, Physics, Scene, Types } from "phaser";
import { setTextShadowMd, TextConfig } from "../styles/TextConfig";

const x0 = 5;
const y0 = 500;
const minSpeed = 250;
const maxSpeed = 1000;
const maxAngle = Math.PI / 2;
const angleStep = 0.0174 * 5; // roughly 1 degree in radians
const speedStep = 50;
const resetTime = ms("20 seconds");
const maxWallBouncesPerBall = 4;
const minTimeToBug = ms("5 seconds");
const maxTimeToBug = ms("5 minutes");
const timeToDestroyText = 7000;

type Cannonball = Types.Physics.Arcade.ImageWithDynamicBody & {
    totalBounces: number;
    shotBy: string;
};

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
    private speed = (maxSpeed - minSpeed) / 2 + minSpeed;
    // each ball has type Types.Physics.Arcade.ImageWithDynamicBody
    private balls!: Physics.Arcade.Group;
    private speedBar!: GameObjects.Rectangle;
    private cannonPipe!: GameObjects.Image;
    private bugs!: Physics.Arcade.StaticGroup;

    constructor(key = "Cannon") {
        super(key);
    }

    public preload() {
        this.load
            .image("cannonball", "images/cannonball.png")
            .image("cannon-pipe", "images/cannon-pipe.png")
            .image("cannon-stand", "images/cannon-stand.png")
            .image("bug", "images/bug.png")
            .audio("oh-yeah", "sounds/oh-yeah.mp3")
            .audio("cannon-shot", "sounds/cannon_fire.mp3")
            .audio("cannon-hit", "sounds/cannon_hit_wall_no_splash.mp3");
    }

    public create() {
        this.physics.world.gravity.y = 98.1;
        // do not collide with top
        this.physics.world.setBoundsCollision(true, true, false, true);
        this.physics.world.on("worldbounds", (collidingObjBody: any) => {
            if (collidingObjBody.gameObject?.texture?.key === "cannonball") {
                const collidingBall = collidingObjBody.gameObject as Cannonball;
                collidingBall.totalBounces += 1;
                this.sound.play("cannon-hit", {
                    volume: Math.max(
                        (0.1 *
                            (maxWallBouncesPerBall -
                                collidingBall.totalBounces)) /
                            maxWallBouncesPerBall,
                        0
                    ),
                });
            }
        });
        this.balls = this.physics.add.group({
            collideWorldBounds: true,
            bounceX: 0.5,
            bounceY: 0.5,
            "setDepth.value": 300,
        });
        this.bugs = this.physics.add.staticGroup({});

        this.physics.add.overlap(this.balls, this.bugs, (ball1, bug) => {
            const ball = ball1 as Cannonball;

            bug.destroy();
            this.scheduleCreateBug();

            const text = this.add
                .text(
                    this.scale.width / 2,
                    150,
                    `${ball.shotBy} squashed a bug!`,
                    TextConfig.text
                )
                .setOrigin(0.5, 0)
                .setAlpha(0);
            setTextShadowMd(text);
            const timeline = this.tweens.createTimeline();
            timeline.add({
                targets: text,
                alpha: 1,
                duration: 200,
                hold: timeToDestroyText - 300,
            });
            timeline.add({
                targets: text,
                alpha: 0,
                duration: 300,
                onComplete: () => text.destroy(),
            });
            timeline.play();
            this.sound.play("oh-yeah", { volume: 0.2 });
        });

        this.scheduleCreateBug();

        this.speedBar = this.add
            .rectangle(300, 50, 200, 48, 0x00ff00)
            .setOrigin(0, 0.5)
            .setVisible(false); // TODO how to display speed?
        this.cannonPipe = this.add
            .image(x0, y0 + 20 - 17, "cannon-pipe")
            .setFlipX(true)
            .setOrigin(0.5, 1)
            .setDepth(301)
            .setRotation(Math.PI / 2); // start lying flat
        this.add
            .image(x0 + 20, y0 + 2, "cannon-stand")
            .setDepth(301)
            .setRotation(Math.PI / 2);
        this.redraw();
    }

    public handleMessage(command: Commands, username: string) {
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
                this.shoot(username);
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

    private scheduleCreateBug() {
        const delay = random(minTimeToBug, maxTimeToBug);
        this.time.delayedCall(delay, () => {
            const width = this.scale.width;
            const height = this.scale.height;
            this.bugs.create(
                random(width * 0.5, width * 0.9),
                random(height * 0.1, height * 0.7),
                "bug"
            );
        });
    }

    private increaseGravityY(amount: number) {
        this.physics.world.gravity.y += amount;
    }

    private shoot(username: string) {
        const ball: Cannonball = this.balls
            .create(x0, y0, "cannonball")
            .setScale(0.35);
        ball.totalBounces = 0;
        ball.shotBy = username;
        ball.on("worldbounds", () => {
            ball.totalBounces += 1;
            console.log("ball bounced", ball.totalBounces);
        });
        ball.body.gameObject = ball;
        const v = new Phaser.Math.Vector2(this.speed, 0);
        v.setAngle(-this.angle);
        ball.setVelocity(v.x, v.y);
        ball.body.setAllowGravity(true);
        ball.setCollideWorldBounds(true, 0.5, 0.5, true);
        this.sound.play("cannon-shot", { volume: 0.2 });

        this.time.delayedCall(resetTime, () =>
            this.balls.remove(ball, true, true)
        );
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
}
