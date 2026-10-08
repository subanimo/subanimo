#!/usr/bin/env node
// Builds release/Subanimo-<version>.zip: a small, platform-independent package.
// The launchers inside download Node.js and the components on first start.
const fs = require("node:fs");
const path = require("node:path");
const {execFileSync} = require("node:child_process");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
const releaseDir = path.join(root, "release");
const stage = path.join(releaseDir, "stage", "Subanimo");
const zipFile = path.join(releaseDir, `Subanimo-${pkg.version}.zip`);

const INCLUDE = [
  "Subanimo.command",
  "Subanimo.bat",
  "README.md",
  "AI_INSTALL.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "tsconfig.build.json",
  "bin",
  "dist",
  "src",
  "ui",
  "scripts",
  "prompts",
  "sample/showcase-variants.json",
];

execFileSync("npm", ["run", "build"], {cwd: root, stdio: "inherit"});

fs.rmSync(path.join(releaseDir, "stage"), {recursive: true, force: true});
fs.mkdirSync(stage, {recursive: true});
for (const rel of INCLUDE) {
  const from = path.join(root, rel);
  if (!fs.existsSync(from)) {
    console.warn(`[package] missing, skipped: ${rel}`);
    continue;
  }
  fs.cpSync(from, path.join(stage, rel), {recursive: true});
}

// Windows batch files need CRLF line endings; the macOS launcher must be executable.
const bat = path.join(stage, "Subanimo.bat");
fs.writeFileSync(bat, fs.readFileSync(bat, "utf-8").replace(/\r?\n/g, "\r\n"));
fs.chmodSync(path.join(stage, "Subanimo.command"), 0o755);

fs.rmSync(zipFile, {force: true});
execFileSync("zip", ["-qryX", zipFile, "Subanimo"], {cwd: path.dirname(stage)});
fs.rmSync(path.join(releaseDir, "stage"), {recursive: true, force: true});
console.log(`[package] ${zipFile} (${(fs.statSync(zipFile).size / 1e6).toFixed(1)} MB)`);
