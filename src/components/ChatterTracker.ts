import { sample } from "lodash";
import Sentiment from "sentiment";
import { Neko } from "./Neko";

const doNotSayHiTo = ["typescriptteatime"];
const goodbyeSnippets = [
    "goodbye",
    "bye",
    "cya",
    "see ya",
    "see you",
    "ciao",
    "byebye",
    "gotta run",
    "got to run",
    "meeting coming up",
];

export class ChatterTracker {
    private chatters: string[] = [...doNotSayHiTo];
    private sentiment = new Sentiment();

    constructor(private readonly cats: Neko[]) {}

    public handleChatMessage(
        msg: string,
        username: string,
        displayName?: string
    ) {
        this.upsertChatter(username, displayName || username);
        this.makeCatsReactToChatMessage(msg);
        this.handleChatGoodbye(msg, displayName || username);
    }

    private upsertChatter(username: string, displayName: string) {
        console.log(username);
        if (this.chatters.includes(username)) {
            return;
        }

        this.chatters.push(username);
        sample(this.cats)!.sayHi(displayName);
    }

    public handleChatGoodbye(msg: string, displayName: string) {
        if (goodbyeSnippets.some((snippet) => msg.includes(snippet))) {
            sample(this.cats)!.sayGoodbyeTo(displayName);
        }
    }

    private makeCatsReactToChatMessage(msg: string) {
        const result = this.sentiment.analyze(msg);
        console.log("sentiment score", result.score);
        if (result.score >= 4) {
            this.cats.forEach((c) => c.laugh());
        }
        if (result.score <= -4) {
            this.cats.forEach((c) => c.beShocked());
        }
    }
}
