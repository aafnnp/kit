#!/usr/bin/env bash
# Runs the NSH CLI version this app is built and tested with, downloading it
# into .tools/ on first use so a stale system-wide `nsh` cannot be picked up.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${NSH_VERSION:-0.3.0}"
BIN="$ROOT/.tools/nsh/bin/nsh"

if [[ ! -x "$BIN" ]]; then
  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64) ARCHIVE="nsh-macos-arm64.tar.gz" ;;
    Linux-x86_64) ARCHIVE="nsh-linux-x86_64.tar.gz" ;;
    *)
      echo "No prebuilt NSH $VERSION for $(uname -s)-$(uname -m)." >&2
      echo "Install NSH $VERSION from https://nsh.dev/docs/installation and run it directly." >&2
      exit 1
      ;;
  esac

  echo "Downloading NSH $VERSION ($ARCHIVE)…"
  mkdir -p "$ROOT/.tools"
  curl -fL --retry 3 \
    "https://github.com/longbridge/nsh/releases/download/v${VERSION}/${ARCHIVE}" \
    | tar -xz -C "$ROOT/.tools"
fi

exec "$BIN" "$@"
