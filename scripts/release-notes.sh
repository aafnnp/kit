#!/usr/bin/env bash
# 生成 GitHub Release 说明：安装指引 + CHANGELOG 中对应版本的条目。
#
# 用法：scripts/release-notes.sh <tag> [owner/repo] > notes.md
# 缺少该版本的 CHANGELOG 条目时，回退为列出上一个标签以来的提交。
set -euo pipefail

TAG="${1:?用法: release-notes.sh <tag> [owner/repo]}"
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

cat <<EOF
## 安装

| 平台 | 安装方式 |
| --- | --- |
| macOS | 解压 \`kit-${VERSION}-macos.zip\`，把 \`Kit.app\` 拖入「应用程序」 |
| Windows | 解压 \`kit-${VERSION}-windows.zip\`，运行 \`Kit.exe\` |
| Linux | 解压 \`kit-${VERSION}-linux.tar.gz\`，运行其中的 \`Kit\`（需要 GTK 4.14+） |
| Web | 解压 \`kit-${VERSION}-web.tar.gz\`，部署到任意静态站点 |

下载后可用 \`SHA256SUMS.txt\` 校验完整性。

## 变更

EOF

printf '%s\n' "$section"
printf '\n**Full Changelog**: %s\n' "$CHANGELOG_URL"
