import { sample } from "lodash";
import { Neko } from "./Neko";

export class ChatterTracker {
    private chatters: string[] = [];

    constructor(private readonly cats: Neko[]) {}

    public UpsertChatter(username: string) {
        if (this.chatters.includes(username)) {
            return;
        }

        this.chatters.push(username);
        sample(this.cats)!.sayHi(username);
    }
}
