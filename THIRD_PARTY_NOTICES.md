# Third-party notices

Subanimo's own code is covered by [LICENSE](LICENSE). It does **not** ship third-party code or assets in its repository or release package: everything below is downloaded from its original source onto the user's computer during setup (`npm ci` and `scripts/fetch-assets.js`), under that source's own license.

## Remotion

Rendering is done with [Remotion](https://www.remotion.dev) (`remotion` and `@remotion/*` packages, installed from npm).

Remotion is free for individuals, for-profit organizations with up to 3 employees, and non-profit organizations; larger for-profit organizations need a Remotion Company License. Read the exact terms before use: https://www.remotion.dev/license

A few `@remotion/*` packages declare `"license": "UNLICENSED"` in their `package.json` without a license file of their own (for example `@remotion/effects`, `@remotion/transitions`); they are part of the Remotion project, so check Remotion's license page above for their terms.

## Fonts (downloaded into `public/fonts/`)

- **Anton** by Vernon Adams — SIL Open Font License 1.1 — https://github.com/google/fonts/tree/main/ofl/anton
- **Inter** by Rasmus Andersson — SIL Open Font License 1.1 — https://github.com/google/fonts/tree/main/ofl/inter

The license texts are downloaded next to the fonts (`public/fonts/licenses/`).

## Animated emoji (downloaded into `public/emoji/`)

The `emojiBurst` animations are Google's **Noto Animated Emoji** in Lottie format, downloaded from `fonts.gstatic.com` (the same files `@remotion/animated-emoji` points to). See Google's terms for these animations: https://googlefonts.github.io/noto-emoji-animation/

## Other npm packages

The remaining dependencies installed by `npm ci` are mostly MIT, ISC, BSD and Apache-2.0 licensed; `mediabunny` (used inside Remotion) is MPL-2.0. Run `npm ls --omit=dev --all` in the app folder to list them; each package's license is in its own folder under `node_modules/`.
