import { random, toInteger } from "lodash";
import { GameObjects, Scene, Types } from "phaser";

const styles: Types.GameObjects.Text.TextStyle = {
    fontFamily: "PressStart2P",
    fontSize: "128px",
};
const Cfg = {
    styles,
    displayTimeInMs: 10000,
};

export class DiceRoll extends GameObjects.Text {
    private diceSides = 2;

    constructor(scene: Scene, msg: string) {
        super(
            scene,
            scene.scale.width / 2,
            scene.scale.height / 2,
            "",
            Cfg.styles
        );
        scene.add.existing(this);

        const diceSides = toInteger(msg.split("!roll ")[1]);
        if (!Number.isInteger(diceSides)) return;
        this.diceSides = diceSides;
        this.setOrigin(0.5, 0.5);

        this.scene.time.delayedCall(5000, () => this.destroy());

        let last = 5000;
        const tween = this.scene.tweens.addCounter({
            duration: 5000,
            from: 5000,
            to: 0,
            ease: Phaser.Math.Easing.Expo.Out,
            onStart: () => {
                this.scene.sound.play("diceroll", { volume: 1 });
            },
            onUpdate: () => {
                const current = Math.floor(tween.getValue() / 200);
                if (current < last) {
                    last = current;
                    this.setText(this.nextRandom);
                }
            },
        });
    }

    get nextRandom() {
        return random(1, this.diceSides).toString();
    }
}
