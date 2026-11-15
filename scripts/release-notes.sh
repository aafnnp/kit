#!/usr/bin/env bash
# 生成 GitHub Release 说明：安装指引 + CHANGELOG 中对应版本的条目。
#
# 用法：scripts/release-notes.sh <tag> [owner/repo] > notes.md
#       scripts/release-notes.sh --section <tag> > changes.md
# `--section` 只输出变更条目，作为 `nsh update-manifest --notes` 的内容。
# 缺少该版本的 CHANGELOG 条目时，回退为列出上一个标签以来的提交。
set -euo pipefail

MODE="full"
if [[ "${1:-}" == "--section" ]]; then
  MODE="section"
  shift
fi

TAG="${1:?用法: release-notes.sh [--section] <tag> [owner/repo]}"
REPO="${2:-${GITHUB_REPOSITORY:-aafnnp/kit}}"
VERSION="${TAG#v}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if PREV="$(git -C "$ROOT" describe --tags --abbrev=0 --match 'v*' "${TAG}^" 2>/dev/null)"; then
  RANGE="${PREV}..${TAG}"
  CHANGELOG_URL="https://github.com/${REPO}/compare/${PREV}...${TAG}"
else
  PREV=""
  RANGE="${TAG}"
  CHANGELOG_URL="https://github.com/${REPO}/commits/${TAG}"
fi

section="$(awk -v heading="## v${VERSION}" '
  $0 == heading { inside = 1; next }
  inside && /^## / { exit }
  inside { print }
' "$ROOT/CHANGELOG.md" | sed -e '/./,$!d')"

if [[ -z "${section//[[:space:]]/}" ]]; then
  section="$(git -C "$ROOT" log --no-merges --pretty='- %s' "$RANGE" 2>/dev/null || true)"
  [[ -n "$section" ]] || section="- 无变更记录"
fi

if [[ "$MODE" == "section" ]]; then
  printf '%s\n' "$section"
  exit 0
fi

cat <<EOF
## 安装

| 平台 | 安装方式 |
| --- | --- |
| macOS（Apple 芯片） | 打开 \`kit-${VERSION}-macos-arm64.dmg\`，把 \`Kit\` 拖入「应用程序」；免安装用同名 \`.zip\` |
| macOS（Intel） | 打开 \`kit-${VERSION}-macos-x86_64.dmg\`，把 \`Kit\` 拖入「应用程序」；免安装用同名 \`.zip\` |
| Windows（x64） | 运行 \`kit-${VERSION}-windows-x86_64-setup.exe\`；免安装用 \`kit-${VERSION}-windows-x86_64.zip\` |
| Windows（ARM64） | 运行 \`kit-${VERSION}-windows-arm64-setup.exe\`；免安装用 \`kit-${VERSION}-windows-arm64.zip\` |
| Linux（x86_64） | \`sudo apt install ./kit_${VERSION}_amd64.deb\`；或解压 \`kit-${VERSION}-linux-x86_64.tar.gz\` 运行其中的 \`Kit\` |
| Linux（aarch64） | \`sudo apt install ./kit_${VERSION}_arm64.deb\`；或解压 \`kit-${VERSION}-linux-aarch64.tar.gz\` 运行其中的 \`Kit\` |
| Web | 解压 \`kit-${VERSION}-web.tar.gz\`，部署到任意静态站点 |

Linux 需要 GTK 4.14+；macOS 应用使用 ad-hoc 签名，首次打开请右键选择「打开」。

下载后可用 \`SHA256SUMS.txt\` 校验完整性。

## 变更

EOF

printf '%s\n' "$section"
printf '\n**Full Changelog**: %s\n' "$CHANGELOG_URL"
