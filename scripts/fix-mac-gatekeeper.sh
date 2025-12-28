#!/bin/bash

# 修复 macOS Gatekeeper 问题（临时解决方案）
# 此脚本会移除应用的隔离属性，允许未签名的应用运行

APP_PATH="$1"

if [ -z "$APP_PATH" ]; then
  echo "使用方法: ./scripts/fix-mac-gatekeeper.sh <应用路径>"
  echo "示例: ./scripts/fix-mac-gatekeeper.sh ~/Downloads/Kit.app"
  exit 1
fi

if [ ! -d "$APP_PATH" ]; then
  echo "错误: 找不到应用路径: $APP_PATH"
  exit 1
fi

echo "正在移除隔离属性: $APP_PATH"
xattr -cr "$APP_PATH"

echo "完成！现在可以尝试打开应用了。"
echo "注意: 这只是临时解决方案。对于生产环境，应该配置代码签名。"

