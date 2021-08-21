# OBS Twitch Overlay for Particle Effects

## Getting started

### Installing

Assumes you have globally installed

- git
- node.js

Clone the git repository

```bash
git clone REPO_LINK
```

Install, test and start:

```bash
npm run sanity-check
```

### Building Production

`npm run build`

Then host the files in `./build/` with a webserver. Next, include it in OBS as a Source -> Browser.
I hardcoded my screen size of 1920x1080, so you may need to adjust that.

## Debugging

```bash
npm run dev
# STEP: you can close the window that opens automatically
# STEP: Set a breakpoint in VS CODE
# STEP: Start 'Chrome' debug config in VS Code
# STEP: Maybe reload the window
# STEP: Trigger the breakpoint
```

Check out this cool [how-to](https://github.com/samme/phaser3-faq/wiki#how-do-i-fixdebug-my-game).
