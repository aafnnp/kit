#!/usr/bin/env bash
# Turns `nsh package`'s output in .nsh/out into the files a release ships:
#   linux: kit-<version>-linux-<arch>.tar.gz 与 kit_<version>_<arch>.deb
#   macos: kit-<version>-macos-<arch>.zip 与 kit-<version>-macos-<arch>.dmg
#   web:   kit-<version>-web.tar.gz
#
# 同时把 `nsh package` 因 nsh.json 的 updater 配置写出的自动更新包，
# 以 kit-<version>-<os>-<nsh 架构>.tar.gz 的名字放进同一目录；
# `nsh update-manifest` 从文件名读取平台，架构名用 NSH 的写法（aarch64）。
#
# 用法：scripts/package-release.sh <linux|macos|web> <版本> [架构] [输出目录]
# 架构为 uname -m 的写法（x86_64 / aarch64 / arm64）；web 不需要。
set -euo pipefail

TARGET="${1:?用法: package-release.sh <linux|macos|web> <版本> [架构] [输出目录]}"
VERSION="${2:?缺少版本号}"
ARCH="${3:-}"
OUT="${4:-dist}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BUILT=".nsh/out"
NAME="$(sed -n 's/.*"name": *"\([^"]*\)".*/\1/p' nsh.json | head -n1)"
ID="$(sed -n 's/.*"id": *"\([^"]*\)".*/\1/p' nsh.json | head -n1)"
EXECUTABLE="$(printf '%s' "$NAME" | tr -cd '[:alnum:]')"

fail() {
  echo "打包失败：$*" >&2
  exit 1
}

[[ -n "$NAME" && -n "$ID" && -n "$EXECUTABLE" ]] || fail "nsh.json 缺少 name 或 id"
[[ -d "$BUILT" ]] || fail "缺少 ${BUILT}，先运行 nsh package"
mkdir -p "$OUT"

# 打包过程产生的临时目录在退出时清理。
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# dpkg 的架构名与 uname 的不同。
deb_arch() {
  case "$1" in
    x86_64) echo "amd64" ;;
    aarch64 | arm64) echo "arm64" ;;
    *) fail "deb 不支持的架构：$1" ;;
  esac
}

# NSH 的架构名与 `uname -m` 在 Apple 芯片上不同。
nsh_arch() {
  case "$1" in
    arm64 | aarch64) echo "aarch64" ;;
    x86_64) echo "x86_64" ;;
    *) fail "NSH 不支持的架构：$1" ;;
  esac
}

# 把 `nsh package` 写出的自动更新包整理成发布名；平台后缀原样保留，
# 供 `nsh update-manifest` 生成 latest.json 使用。
stage_update_archive() {
  local platform="$1" extension="$2" member="$3"
  local app_version src dest
  app_version="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' nsh.json | head -n1)"
  src="$BUILT/$NAME-${app_version}-${platform}.${extension}"
  dest="$OUT/kit-${VERSION}-${platform}.${extension}"
  [[ -f "$src" ]] || fail "缺少 ${src}，先运行 nsh package（nsh.json 需要 updater 配置）"
  cp "$src" "$dest"

  if [[ "$extension" == "tar.gz" ]]; then
    tar -tzf "$dest" > "$WORK/update-tar-list.txt"
    grep -qx "$member" "$WORK/update-tar-list.txt" ||
      fail "$dest 里没有 $member"
  fi
  echo "已生成 ${dest}"
}

# Debian 的包名只能用小写字母、数字和 . + -。
package_linux() {
  local arch="$1"
  [[ -n "$arch" ]] || fail "缺少 linux 架构"

  local tarball="$OUT/kit-${VERSION}-linux-${arch}.tar.gz"
  cp "$BUILT/$NAME.tar.gz" "$tarball"
  # 先落到文件再匹配：`tar | grep -q` 会让 tar 收到 SIGPIPE，在 pipefail 下算失败。
  tar -tzf "$tarball" > "$WORK/tar-list.txt"
  grep -qx "$NAME/$EXECUTABLE" "$WORK/tar-list.txt" ||
    fail "$tarball 里没有 $NAME/$EXECUTABLE"

  stage_update_archive "linux-$(nsh_arch "$arch")" "tar.gz" "$NAME/$EXECUTABLE"

  local debarch pkg deb root created_kb
  debarch="$(deb_arch "$arch")"
  pkg="$(printf '%s' "$NAME" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9.+-')"
  deb="$OUT/${pkg}_${VERSION}_${debarch}.deb"
  root="$WORK/deb"
  mkdir -p "$root/DEBIAN" "$root/opt/$NAME" "$root/usr/bin" \
    "$root/usr/share/applications" "$root/usr/share/icons/hicolor/512x512/apps" \
    "$root/usr/share/doc/$pkg"

  # 应用目录整体装进 /opt，desktop 入口用 /usr/bin 里的链接启动它，
  # 这样 NSH 的 desktop 文件里按 PATH 查找的 Exec 依旧成立。
  cp -R "$BUILT/$NAME/." "$root/opt/$NAME/"
  ln -s "/opt/$NAME/$EXECUTABLE" "$root/usr/bin/$pkg"
  sed "s|^Exec=$EXECUTABLE|Exec=$pkg|" "$BUILT/$NAME/$ID.desktop" \
    > "$root/usr/share/applications/$ID.desktop"
  if [[ -f "$BUILT/$NAME/$ID.png" ]]; then
    cp "$BUILT/$NAME/$ID.png" "$root/usr/share/icons/hicolor/512x512/apps/$ID.png"
  fi
  cp LICENSE "$root/usr/share/doc/$pkg/copyright"

  created_kb="$(du -sk "$root/opt" "$root/usr" | awk '{sum += $1} END {print sum}')"
  cat > "$root/DEBIAN/control" <<EOF
Package: $pkg
Version: $VERSION
Architecture: $debarch
Maintainer: aafnnp <aafnnp@users.noreply.github.com>
Installed-Size: ${created_kb}
Depends: libgtk-4-1
Section: utils
Priority: optional
Homepage: https://github.com/aafnnp/kit
Description: local-first cross-platform toolbox
 Kit is a Native Shell (NSH) app: a toolbox for developers whose every tool
 runs on the device, with no account, upload or telemetry.
EOF

  dpkg-deb --build --root-owner-group "$root" "$deb" >/dev/null
  [[ "$(dpkg-deb --field "$deb" Package)" == "$pkg" ]] ||
    fail "$deb 的包名不是 $pkg"
  dpkg-deb --contents "$deb" > "$WORK/deb-list.txt"
  grep -q "opt/$NAME/$EXECUTABLE" "$WORK/deb-list.txt" ||
    fail "$deb 里没有 opt/$NAME/$EXECUTABLE"
  echo "已生成 ${tarball} 与 ${deb}（${debarch}）"
}

package_macos() {
  local arch="$1"
  [[ -n "$arch" ]] || fail "缺少 macOS 架构"

  local app="$BUILT/$NAME.app" binary zip dmg root
  [[ -d "$app" ]] || fail "缺少 ${app}，先运行 nsh package --target macos"
  binary="$app/Contents/MacOS/$EXECUTABLE"
  codesign --verify --deep --strict "$app"
  local archs
  archs="$(lipo -archs "$binary")"
  case " $archs " in
    *" $arch "*) ;;
    *) fail "$app 不是 $arch 构建：$archs" ;;
  esac

  zip="$OUT/kit-${VERSION}-macos-${arch}.zip"
  ditto -c -k --sequesterRsrc --keepParent "$app" "$zip"

  # 安装盘里放应用和「应用程序」链接，用户拖进去即可。
  root="$WORK/dmg"
  mkdir -p "$root"
  ditto "$app" "$root/$NAME.app"
  ln -s /Applications "$root/Applications"
  dmg="$OUT/kit-${VERSION}-macos-${arch}.dmg"
  hdiutil create -quiet -volname "$NAME $VERSION" -srcfolder "$root" -ov \
    -format UDZO "$dmg"
  hdiutil verify -quiet "$dmg"
  echo "已生成 ${zip} 与 ${dmg}（${arch}）"

  stage_update_archive "macos-$(nsh_arch "$arch")" "tar.gz" \
    "$NAME.app/Contents/MacOS/$EXECUTABLE"
}

package_web() {
  local tarball="$OUT/kit-${VERSION}-web.tar.gz"
  tar -czf "$tarball" -C "$BUILT/$NAME" .
  tar -tzf "$tarball" > "$WORK/tar-list.txt"
  grep -qx "./index.html" "$WORK/tar-list.txt" ||
    fail "$tarball 里没有 index.html"
  echo "已生成 $tarball"
}

case "$TARGET" in
  linux) package_linux "$ARCH" ;;
  macos) package_macos "$ARCH" ;;
  web) package_web ;;
  *) fail "不支持的目标：${TARGET}（可选 linux、macos、web）" ;;
esac
