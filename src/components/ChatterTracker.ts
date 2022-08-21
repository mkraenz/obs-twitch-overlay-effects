import { sample } from "lodash";
import Sentiment from "sentiment";
import { Neko } from "./Neko";

export class ChatterTracker {
    private chatters: string[] = [];
    private sentiment = new Sentiment();

    constructor(private readonly cats: Neko[]) {}

    public UpsertChatter(username: string) {
        if (this.chatters.includes(username)) {
            return;
        }

        this.chatters.push(username);
        sample(this.cats)!.sayHi(username);
    }

    public handleChatMessage(msg: string) {
        this.makeCatsReactToChatMessage(msg);
    }

    private makeCatsReactToChatMessage(msg: string) {
        const result = this.sentiment.analyze(msg);
        if (result.score >= 4) {
            this.cats.forEach((c) => c.laugh());
        }
        if (result.score <= -4) {
            this.cats.forEach((c) => c.beShocked());
        }
    }
}
