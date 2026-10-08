# AI_INSTALL.md — instructions for AI assistants

You are helping a non-technical user install and start Subanimo on their own computer. Follow these steps in order, explain what you do in one short sentence each, and ask before doing anything outside this folder. Talk to the user in their language.

Subanimo is a local web app. Nothing is installed system-wide: Node.js and all components go into this folder.

## 1. Check the folder

You must be in the folder that contains `package.json` and `Subanimo.command` / `Subanimo.bat`.

## 2. Start it with the launcher (preferred)

The launcher uses the computer's Node.js if it is version 20 or newer (it also looks in Homebrew, nvm and Volta folders), otherwise downloads a private copy into `.runtime/`; then it installs the components, downloads fonts and emoji, and starts the app.

- **macOS:**
  ```bash
  xattr -dr com.apple.quarantine .
  chmod +x Subanimo.command
  ./Subanimo.command
  ```
- **Windows (PowerShell):**
  ```powershell
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\launch.ps1
  ```

The first run takes a few minutes. It is ready when the output shows a line like `Subanimo çalışıyor: http://127.0.0.1:3210` and the browser opens. The process must keep running; do not stop it. If the browser did not open, give the user that address.

## 3. If the launcher fails

Use a system Node.js 20 or newer instead (check with `node --version`; if it is missing, ask the user before installing it):

```bash
npm ci            # in a git checkout without dist/: then also run `npm run build`
node scripts/fetch-assets.js
node dist/render.js app
```

Common causes:
- No internet or a proxy blocking `nodejs.org` / `registry.npmjs.org` / `raw.githubusercontent.com` / `fonts.gstatic.com`.
- Windows: path too long. Move the folder to `C:\Subanimo` and retry.
- Port 3210 busy: set the environment variable `SUBANIMO_PORT` to another port.
- An interrupted download: just run the launcher again; it resumes.

## 4. Done

Tell the user:
- Next time, they start Subanimo by right-clicking `Subanimo.command` → Open (Mac) or double-clicking `Subanimo.bat` (Windows).
- The black terminal window must stay open while they use the app.
- Rendered files go to the `Subanimo` folder in their home folder.
- Subanimo is for non-commercial use only (PolyForm Noncommercial 1.0.0, see LICENSE). It also uses Remotion, whose license applies: https://www.remotion.dev/license

Do not change the source code, do not commit anything and do not publish anything on the user's behalf.
