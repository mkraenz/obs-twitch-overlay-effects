import { GameObjects } from "phaser";
import { Color } from "./Color";

type Style = Partial<GameObjects.TextStyle>;

export const TextConfig: { [key in "md" | "debug"]: Style } = {
    md: {
        fontFamily: "Helvetica",
        fontSize: "12px",
        color: "#010001",
    },
    debug: {
        fontFamily: "Courier",
        fontSize: "12px",
        color: Color.HackerGreen,
    },
};

export const setTextShadow = (text: GameObjects.Text) => {
    text.setStroke(text.style.color, 1.3);
    text.setShadow(2, 2, "#000000", 2, true, true);
};
