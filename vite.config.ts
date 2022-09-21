import { defineConfig } from "vite";

export default defineConfig({
    publicDir: "assets",
    build: {
        outDir: "build",
    },
    server: {
        open: true,
    },
});
