#!/usr/bin/env bash
# Runs the NSH CLI version this app is built and tested with, downloading it
# into .tools/ on first use so a stale system-wide `nsh` cannot be picked up.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${NSH_VERSION:-0.3.0}"
BIN="$ROOT/.tools/nsh/bin/nsh"

if [[ -x "$BIN" ]]; then
  INSTALLED="$("$BIN" --version 2>/dev/null || true)"
  if [[ "$INSTALLED" == *"$VERSION"* ]]; then
    exec "$BIN" "$@"
  fi
fi

case "$VERSION-$(uname -s)-$(uname -m)" in
  0.3.0-Darwin-arm64)
    ARCHIVE="nsh-macos-arm64.tar.gz"
    SHA256="34fdd2ec43d5e22986723e7633acf9223e365bd5bace1a502b5ae24fb75c266c"
    ;;
  0.3.0-Linux-x86_64)
    ARCHIVE="nsh-linux-x86_64.tar.gz"
    SHA256="539ecf9d76d156b5afa5a086212f23764bfc3945c7395a2119b73a3c66effed0"
    ;;
  *)
    echo "No pinned NSH archive for $VERSION on $(uname -s)-$(uname -m)." >&2
    echo "Add its SHA256 to scripts/nsh.sh or install NSH $VERSION from https://nsh.dev/docs/installation." >&2
    exit 1
    ;;
esac

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "Downloading NSH $VERSION ($ARCHIVE)…"
curl -fsSL --retry 3 -o "$TMP/$ARCHIVE" \
  "https://github.com/longbridge/nsh/releases/download/v${VERSION}/${ARCHIVE}"

if command -v shasum >/dev/null 2>&1; then
  ACTUAL="$(shasum -a 256 "$TMP/$ARCHIVE" | awk '{print $1}')"
else
  ACTUAL="$(sha256sum "$TMP/$ARCHIVE" | awk '{print $1}')"
fi
if [[ "$ACTUAL" != "$SHA256" ]]; then
  echo "NSH archive checksum mismatch: expected $SHA256, got $ACTUAL" >&2
  exit 1
fi

rm -rf "$ROOT/.tools/nsh"
mkdir -p "$ROOT/.tools"
tar -xzf "$TMP/$ARCHIVE" -C "$ROOT/.tools"
exec "$BIN" "$@"
