import { sample } from "lodash";
import Sentiment from "sentiment";
import { Neko } from "./Neko";

const doNotSayHiTo = ["typescriptteatime"];
export class ChatterTracker {
    private chatters: string[] = [...doNotSayHiTo];
    private sentiment = new Sentiment();

    constructor(private readonly cats: Neko[]) {}

    public UpsertChatter(username: string, displayName: string) {
        console.log(username);
        if (this.chatters.includes(username)) {
            return;
        }

        this.chatters.push(username);
        sample(this.cats)!.sayHi(displayName);
    }

    public handleChatMessage(msg: string) {
        this.makeCatsReactToChatMessage(msg);
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
