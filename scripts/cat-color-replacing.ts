import replaceColor from "replace-color-ts";

const main = async () => {
    // light blue-> light green
    const midori1 = await replaceColor({
        // path relative to where the script is run from
        image: "./assets/images/ao.png",
        colors: {
            type: "hex",
            targetColor: "#5FCDE4", // current color we want to replace
            replaceColor: "#99E550", // new color to replace with
        },
    });
    // dark blue -> dark green
    const midori2 = await replaceColor({
        image: midori1,
        colors: {
            type: "hex",
            targetColor: "#3f3f74", // current color we want to replace
            replaceColor: "#4b692f", // new color to replace with
        },
    });
    midori2.write("./assets/images/midori.png", (err) => {
        if (err) return console.log(err);
    });

    const pink1 = await replaceColor({
        image: "./assets/images/ao.png",
        colors: {
            type: "hex",
            targetColor: "#5FCDE4", // current color we want to replace
            replaceColor: "#ffabb5", // new color to replace with
        },
    });
    const pink2 = await replaceColor({
        image: pink1,
        colors: {
            type: "hex",
            targetColor: "#3f3f74", // current color we want to replace
            replaceColor: "#94656b", // new color to replace with
        },
    });
    pink2.write("./assets/images/pink.png", (err) => {
        if (err) return console.log(err);
    });
};

main().catch((e) => console.error(e));
