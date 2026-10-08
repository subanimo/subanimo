#!/bin/bash
# Subanimo launcher for macOS.
# First time: right-click this file -> Open -> Open (macOS asks once because the app is not signed).
# İlk sefer: dosyaya sağ tıklayın -> Aç -> Aç (uygulama imzasız olduğu için macOS bir kez sorar).

set -u
cd "$(dirname "$0")" || exit 1
APP="$(pwd)"
RUNTIME="$APP/.runtime"
NODE_MAJOR=22

say() { printf '\n  %s\n  %s\n' "$1" "$2"; }
fail() {
  say "ERROR: $1" "HATA: $2"
  printf '\n'
  read -r -p "  Press Enter to close / Kapatmak için Enter'a basın... " _
  exit 1
}

# Files downloaded from the internet are quarantined; clear that once for the app folder
# so the bundled helper programs are not blocked one by one.
xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true

case "$(uname -m)" in
  arm64) PLATFORM=darwin-arm64 ;;
  x86_64) PLATFORM=darwin-x64 ;;
  *) fail "Unsupported processor: $(uname -m)" "Desteklenmeyen işlemci: $(uname -m)" ;;
esac

# 1. Node.js: use the one already on this computer if it is version 20 or newer,
#    otherwise download a private copy into the app folder (nothing is installed system-wide).
node_ok() {
  [ -x "$1" ] && [ -x "$(dirname "$1")/npm" ] || return 1
  local major
  major="$("$1" -p 'process.versions.node.split(".")[0]' 2>/dev/null)" || return 1
  [ "${major:-0}" -ge "$NODE_MAJOR_MIN" ] 2>/dev/null
}
NODE_MAJOR_MIN=20
NODE_BIN=""
# Double-clicked scripts do not load shell profiles, so also look where Homebrew, nvm and Volta keep Node.
for c in "$(command -v node 2>/dev/null)" /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.volta/bin/node" "$HOME"/.nvm/versions/node/v*/bin/node "$RUNTIME/node/bin/node"; do
  if [ -n "$c" ] && node_ok "$c"; then NODE_BIN="$c"; break; fi
done

if [ -z "$NODE_BIN" ]; then
  say "Downloading Node.js (one time, about 50 MB)..." "Node.js indiriliyor (bir kerelik, yaklaşık 50 MB)..."
  mkdir -p "$RUNTIME"
  BASE="https://nodejs.org/dist/latest-v${NODE_MAJOR}.x"
  SUMS="$(curl -fsSL --retry 3 "$BASE/SHASUMS256.txt")" || fail "Cannot reach nodejs.org. Check the internet connection and start again." "nodejs.org'a ulaşılamıyor. İnternet bağlantısını kontrol edip yeniden başlatın."
  LINE="$(printf '%s\n' "$SUMS" | grep -E " node-v[0-9.]+-${PLATFORM}\.tar\.gz$" | head -1)"
  [ -n "$LINE" ] || fail "No Node.js download found for $PLATFORM." "$PLATFORM için Node.js bulunamadı."
  SHA="${LINE%% *}"
  FILE="${LINE##* }"
  curl -fL --retry 3 -C - -o "$RUNTIME/$FILE" "$BASE/$FILE" || fail "Download interrupted. Start again to continue." "İndirme yarıda kaldı. Devam etmek için yeniden başlatın."
  if ! printf '%s  %s\n' "$SHA" "$RUNTIME/$FILE" | shasum -a 256 -c - >/dev/null 2>&1; then
    rm -f "$RUNTIME/$FILE"
    fail "The download is damaged. Start again." "İndirilen dosya bozuk. Yeniden başlatın."
  fi
  rm -rf "$RUNTIME/node" && mkdir -p "$RUNTIME/node"
  tar -xzf "$RUNTIME/$FILE" -C "$RUNTIME/node" --strip-components 1 || fail "Could not unpack Node.js." "Node.js açılamadı."
  rm -f "$RUNTIME/$FILE"
  NODE_BIN="$RUNTIME/node/bin/node"
fi
export PATH="$(dirname "$NODE_BIN"):$PATH"
say "Using Node.js $("$NODE_BIN" --version) ($NODE_BIN)" "Node.js $("$NODE_BIN" --version) kullanılıyor ($NODE_BIN)"

# 2. Components (re-installed only when package-lock.json changes, e.g. after an update).
LOCK_HASH="$(shasum -a 256 package-lock.json | cut -d' ' -f1)"
MARKER="node_modules/.subanimo-installed"
if [ ! -f "$MARKER" ] || [ "$(cat "$MARKER")" != "$LOCK_HASH" ]; then
  say "Installing components (one time, a few minutes)..." "Bileşenler kuruluyor (bir kerelik, birkaç dakika)..."
  # npm ci wipes node_modules; keep the downloaded Chrome (node_modules/.remotion, ~170 MB) across updates.
  CHROME_KEEP="$RUNTIME/remotion-cache"
  if [ -d node_modules/.remotion ]; then
    mkdir -p "$RUNTIME" && rm -rf "$CHROME_KEEP" && mv node_modules/.remotion "$CHROME_KEEP"
  fi
  if [ -f dist/render.js ]; then
    npm ci --omit=dev --no-audit --no-fund
  else
    # Source checkout (git clone): also build the app.
    npm ci --no-audit --no-fund && npm run build
  fi
  INSTALL_STATUS=$?
  if [ -d "$CHROME_KEEP" ]; then
    mkdir -p node_modules && rm -rf node_modules/.remotion && mv "$CHROME_KEEP" node_modules/.remotion
  fi
  [ "$INSTALL_STATUS" -eq 0 ] || fail "Installation failed. Check the internet connection and start again." "Kurulum başarısız. İnternet bağlantısını kontrol edip yeniden başlatın."
  printf '%s' "$LOCK_HASH" > "$MARKER"
fi

# 3. Fonts and emoji for offline rendering (skips files that are already there).
node scripts/fetch-assets.js

# 4. Start the app; it opens in the browser.
say "Starting Subanimo... Keep this window open while you use it." "Subanimo başlatılıyor... Kullanırken bu pencereyi açık tutun."
node dist/render.js app || fail "Subanimo stopped unexpectedly." "Subanimo beklenmedik şekilde durdu."
