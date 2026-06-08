#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ELECTRON_DIR="$ROOT/node_modules/electron"
FRAMEWORK="$ELECTRON_DIR/dist/Electron.app/Contents/Frameworks/Electron Framework.framework/Electron Framework"

if [ -L "$FRAMEWORK" ] && "$ELECTRON_DIR/dist/Electron.app/Contents/MacOS/Electron" --version >/dev/null 2>&1; then
  echo "Electron already installed."
  exit 0
fi

VERSION="$(node -p "require('$ELECTRON_DIR/package.json').version")"
ARCH="$(uname -m)"
PLATFORM="darwin"

if [ "$ARCH" = "x86_64" ]; then
  ARCH="x64"
elif [ "$ARCH" = "arm64" ]; then
  ARCH="arm64"
fi

ZIP="electron-v${VERSION}-${PLATFORM}-${ARCH}.zip"
MIRROR="${ELECTRON_MIRROR:-https://npmmirror.com/mirrors/electron/}"
URL="${MIRROR}${VERSION}/${ZIP}"
TMP="$(mktemp -d)"

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

echo "Downloading Electron ${VERSION} (${PLATFORM}-${ARCH})..."
curl -L --fail --progress-bar -o "$TMP/electron.zip" "$URL"

echo "Extracting (preserving macOS symlinks)..."
rm -rf "$ELECTRON_DIR/dist" "$ELECTRON_DIR/path.txt"
mkdir -p "$ELECTRON_DIR/dist"
ditto -x -k "$TMP/electron.zip" "$ELECTRON_DIR/dist"
printf 'Electron.app/Contents/MacOS/Electron' > "$ELECTRON_DIR/path.txt"

echo "Verifying..."
test -L "$ELECTRON_DIR/dist/Electron.app/Contents/Frameworks/Electron Framework.framework/Electron Framework"
"$ELECTRON_DIR/dist/Electron.app/Contents/MacOS/Electron" --version
echo "Electron installed successfully."
