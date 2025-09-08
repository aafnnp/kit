#!/usr/bin/env node

/**
 * 版本更新脚本
 * 用于同步更新package.json和manifest.json中的版本号
 */

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function updateVersion(newVersion, updatePackageJson = false) {
  console.log(`🔄 更新版本号到: ${newVersion}`)

  try {
    // 验证版本号格式
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/
    if (!versionRegex.test(newVersion)) {
      throw new Error('版本号格式错误，应为 x.y.z 或 x.y.z-suffix')
    }

    // 1. 更新 manifest.json
    const manifestPath = path.join(rootDir, 'manifest.json')
    if (await fs.pathExists(manifestPath)) {
      const manifest = await fs.readJson(manifestPath)
      const oldVersion = manifest.version
      manifest.version = newVersion

      await fs.writeJson(manifestPath, manifest, { spaces: 2 })
      console.log(`✅ manifest.json: ${oldVersion} → ${newVersion}`)
    } else {
      console.warn('⚠️ manifest.json 文件不存在')
    }

    // 2. 更新 package.json (可选)
    if (updatePackageJson) {
      const packagePath = path.join(rootDir, 'package.json')
      if (await fs.pathExists(packagePath)) {
        const packageJson = await fs.readJson(packagePath)
        const oldVersion = packageJson.version
        packageJson.version = newVersion

        await fs.writeJson(packagePath, packageJson, { spaces: 2 })
        console.log(`✅ package.json: ${oldVersion} → ${newVersion}`)
      } else {
        console.warn('⚠️ package.json 文件不存在')
      }
    }

    // 3. 生成版本信息文件
    const versionInfo = {
      version: newVersion,
      updatedAt: new Date().toISOString(),
      buildNumber: Date.now(),
      branch: await getCurrentBranch(),
      commit: await getCurrentCommit(),
    }

    const versionInfoPath = path.join(rootDir, 'version-info.json')
    await fs.writeJson(versionInfoPath, versionInfo, { spaces: 2 })
    console.log(`📋 版本信息已生成: ${versionInfoPath}`)

    return versionInfo
  } catch (error) {
    console.error('❌ 版本更新失败:', error)
    process.exit(1)
  }
}

async function getCurrentBranch() {
  try {
    const { execSync } = await import('child_process')
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

async function getCurrentCommit() {
  try {
    const { execSync } = await import('child_process')
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

async function getCurrentVersion() {
  try {
    const manifestPath = path.join(rootDir, 'manifest.json')
    if (await fs.pathExists(manifestPath)) {
      const manifest = await fs.readJson(manifestPath)
      return manifest.version
    }

    const packagePath = path.join(rootDir, 'package.json')
    if (await fs.pathExists(packagePath)) {
      const packageJson = await fs.readJson(packagePath)
      return packageJson.version
    }

    return '0.0.1'
  } catch {
    return '0.0.1'
  }
}

function incrementVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`
  }
}

// CLI 处理
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('📋 版本更新脚本使用方法:')
    console.log('  node scripts/update-version.mjs <version>          # 设置指定版本')
    console.log('  node scripts/update-version.mjs --patch            # 增加补丁版本')
    console.log('  node scripts/update-version.mjs --minor            # 增加次要版本')
    console.log('  node scripts/update-version.mjs --major            # 增加主要版本')
    console.log('  node scripts/update-version.mjs --current          # 显示当前版本')
    console.log('')
    console.log('选项:')
    console.log('  --package                                          # 同时更新package.json')

    const currentVersion = await getCurrentVersion()
    console.log(`📌 当前版本: ${currentVersion}`)
    return
  }

  const updatePackage = args.includes('--package')

  if (args.includes('--current')) {
    const currentVersion = await getCurrentVersion()
    console.log(`📌 当前版本: ${currentVersion}`)
    return
  }

  let newVersion

  if (args.includes('--patch') || args.includes('--minor') || args.includes('--major')) {
    const currentVersion = await getCurrentVersion()
    let type = 'patch'

    if (args.includes('--major')) type = 'major'
    else if (args.includes('--minor')) type = 'minor'

    newVersion = incrementVersion(currentVersion, type)
    console.log(`🔄 ${type} 版本升级: ${currentVersion} → ${newVersion}`)
  } else {
    newVersion = args.find((arg) => !arg.startsWith('--'))

    if (!newVersion) {
      console.error('❌ 请提供版本号或使用自动增量选项')
      process.exit(1)
    }
  }

  await updateVersion(newVersion, updatePackage)
  console.log('🎉 版本更新完成!')
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { updateVersion, getCurrentVersion, incrementVersion }
