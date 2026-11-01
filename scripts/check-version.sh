#!/usr/bin/env bash
# Keeps the release version and the NSH toolchain version in one place.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

value_of() {
  sed -n "$1" "$2" | head -n 1
}

APP_VERSION_JSON="$(value_of 's/.*"version": "\([^"]*\)".*/\1/p' nsh.json)"
APP_VERSION_TS="$(value_of 's/.*APP_VERSION = "\([^"]*\)".*/\1/p' lib/version.ts)"
NSH_VERSION_TS="$(value_of 's/.*NSH_VERSION = "\([^"]*\)".*/\1/p' lib/version.ts)"
NSH_VERSION_SH="$(value_of 's/.*NSH_VERSION:-\([^}]*\)}.*/\1/p' scripts/nsh.sh)"
NSH_VERSION_PS="$(value_of 's/.*else { "\([^"]*\)".*/\1/p' scripts/nsh.ps1)"
NSH_VERSION_CI="$(value_of 's/.*NSH_VERSION: "\([^"]*\)".*/\1/p' .github/workflows/ci.yml)"
NSH_VERSION_RELEASE="$(value_of 's/.*NSH_VERSION: "\([^"]*\)".*/\1/p' .github/workflows/release.yml)"

fail() {
  echo "version check failed: $*" >&2
  exit 1
}

[[ -n "$APP_VERSION_JSON" ]] || fail "nsh.json has no version"
[[ "$APP_VERSION_JSON" == "$APP_VERSION_TS" ]] || fail "nsh.json ($APP_VERSION_JSON) != lib/version.ts ($APP_VERSION_TS)"
[[ "$NSH_VERSION_TS" == "$NSH_VERSION_SH" ]] || fail "lib/version.ts NSH ${NSH_VERSION_TS} != scripts/nsh.sh ${NSH_VERSION_SH}"
[[ "$NSH_VERSION_TS" == "$NSH_VERSION_PS" ]] || fail "lib/version.ts NSH ${NSH_VERSION_TS} != scripts/nsh.ps1 ${NSH_VERSION_PS}"
[[ "$NSH_VERSION_TS" == "$NSH_VERSION_CI" ]] || fail "lib/version.ts NSH ${NSH_VERSION_TS} != CI ${NSH_VERSION_CI}"
[[ "$NSH_VERSION_TS" == "$NSH_VERSION_RELEASE" ]] || fail "lib/version.ts NSH ${NSH_VERSION_TS} != release ${NSH_VERSION_RELEASE}"

if [[ "${GITHUB_REF_NAME:-}" == v* && "$GITHUB_REF_NAME" != "v$APP_VERSION_JSON" ]]; then
  fail "tag $GITHUB_REF_NAME does not match nsh.json v$APP_VERSION_JSON"
fi

echo "versions OK: app $APP_VERSION_JSON, NSH $NSH_VERSION_TS"
