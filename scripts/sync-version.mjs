#!/usr/bin/env node
// 将发布版本号同步到各个应用配置文件
// 用法：node scripts/sync-version.mjs 0.5.0
//      node scripts/sync-version.mjs v0.5.0
//
// 同步目标：
//   - package.json                -> version
//   - src-tauri/tauri.conf.json   -> version
//   - src-tauri/Cargo.toml        -> [package] 段的 version

// 只改动版本号所在的那一行，避免重新序列化 JSON 造成无关的格式变动。

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const JSON_TARGETS = ['package.json', 'src-tauri/tauri.conf.json']
const CARGO_TARGET = 'src-tauri/Cargo.toml'
// 独占一行的 `version = "x.y.z"`（[package] 段），不会误伤依赖项中的 version
const CARGO_VERSION_LINE = /^([ \t]*version[ \t]*=[ \t]*)"[^"]*"(.*)$/m
// 独占一行的 `"version": "x.y.z"`（顶层字段），不会误伤依赖项中的 version
const JSON_VERSION_LINE = /^([ \t]*"version"[ \t]*:[ \t]*)"[^"]*"(.*)$/m

function fail(message) {
  console.error(`[sync-version] ${message}`)
  process.exit(1)
}

const version = (process.argv[2] || '').trim().replace(/^v/, '')

if (!version) {
  fail('缺少版本号参数。用法：node scripts/sync-version.mjs <version>，例如 0.5.0')
}
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`版本号格式不合法："${version}"，应为 semver 格式，例如 0.5.0 或 0.6.0-beta.1`)
}

function absolute(relativePath) {
  return path.resolve(rootDir, relativePath)
}

function replaceVersionLine(relativePath, linePattern) {
  const file = absolute(relativePath)
  const original = readFileSync(file, 'utf8')

  // 先判断能否匹配到版本行，而不是比较替换前后的字符串：
  // 重复发布同一版本号时替换结果相同，据此判定失败会误报。
  if (!linePattern.test(original)) {
    fail(`${relativePath} 中未找到版本号所在行`)
  }

  const next = original.replace(linePattern, (_match, prefix, suffix) => `${prefix}"${version}"${suffix}`)
  if (next !== original) {
    writeFileSync(file, next)
  }

  return { original, next }
}

function syncJsonVersion(relativePath) {
  const { original, next } = replaceVersionLine(relativePath, JSON_VERSION_LINE)

  // 用解析结果兜底校验：版本号已更新，且其他字段没有被误改
  let before
  let after
  try {
    before = JSON.parse(original)
    after = JSON.parse(next)
  } catch (error) {
    fail(`${relativePath} 不是合法的 JSON：${error.message}`)
  }
  if (after.version !== version) {
    fail(`${relativePath} 版本号同步失败（当前为 ${after.version}）`)
  }
  const stripVersion = (json) => JSON.stringify({ ...json, version: null })
  if (stripVersion(before) !== stripVersion(after)) {
    fail(`${relativePath} 除 version 之外的字段被意外修改`)
  }

  console.log(`[sync-version] ${relativePath} -> ${version}`)
}

function syncCargoVersion() {
  replaceVersionLine(CARGO_TARGET, CARGO_VERSION_LINE)
  console.log(`[sync-version] ${CARGO_TARGET} -> ${version}`)
}

for (const relativePath of JSON_TARGETS) {
  syncJsonVersion(relativePath)
}
syncCargoVersion()
