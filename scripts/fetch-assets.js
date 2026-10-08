#!/usr/bin/env node
// Downloads fonts and animated emoji into public/ so rendering works offline.
// Safe to run again: existing files are skipped. Never fails the install; it only warns.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pub = path.join(root, "public");

const FONTS = [
  ["fonts/Anton-Regular.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf"],
  ["fonts/Inter.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf"],
  ["fonts/licenses/Anton-OFL.txt", "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/OFL.txt"],
  ["fonts/licenses/Inter-OFL.txt", "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt"],
];

const emojiData = () => {
  const dir = path.dirname(require.resolve("@remotion/animated-emoji/package.json"));
  return require(path.join(dir, "dist/cjs/emoji-data.js")).emojis;
};

async function download(rel, url) {
  const dest = path.join(pub, rel);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return "skip";
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const tmp = dest + ".part";
  fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  fs.renameSync(tmp, dest);
  return "ok";
}

(async () => {
  const jobs = [...FONTS];
  try {
    const wanted = JSON.parse(fs.readFileSync(path.join(__dirname, "emoji-list.json"), "utf-8"));
    for (const e of emojiData()) {
      if (wanted.includes(e.name)) jobs.push([`emoji/${e.name}.json`, `https://fonts.gstatic.com/s/e/notoemoji/latest/${e.codepoint}/lottie.json`]);
    }
  } catch (err) {
    console.warn(`[assets] emoji list unavailable: ${err.message}`);
  }
  let ok = 0, skip = 0, failed = 0;
  for (const [rel, url] of jobs) {
    try {
      (await download(rel, url)) === "ok" ? ok++ : skip++;
    } catch (err) {
      failed++;
      console.warn(`[assets] could not download ${rel}: ${err.message}`);
    }
  }
  console.log(`[assets] ${ok} downloaded, ${skip} already present, ${failed} failed`);
})();
