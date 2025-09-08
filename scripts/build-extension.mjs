#!/usr/bin/env node

import { build } from 'vite'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function buildExtension() {
  console.log('🚀 开始构建Chrome扩展...')

  try {
    // 1. 清理输出目录
    console.log('📁 清理输出目录...')
    const distDir = path.join(rootDir, 'dist-extension')
    await fs.remove(distDir)
    await fs.ensureDir(distDir)

    // 检查Node.js版本
    const nodeVersion = process.version
    console.log(`📋 Node.js版本: ${nodeVersion}`)

    // 检查必要的依赖
    const packageJson = await fs.readJson(path.join(rootDir, 'package.json'))
    console.log(`📦 项目版本: ${packageJson.version}`)
    console.log(`📦 项目名称: ${packageJson.name}`)

    // 2. 使用扩展专用配置构建
    console.log('⚡ 构建扩展文件...')
    await build({
      configFile: path.join(rootDir, 'vite.extension.config.ts'),
      mode: 'production',
    })

    // 3. 复制manifest.json
    console.log('📋 复制manifest.json...')
    await fs.copy(path.join(rootDir, 'manifest.json'), path.join(distDir, 'manifest.json'))

    // 4. 复制图标文件
    console.log('🎨 复制图标资源...')
    await fs.copy(path.join(rootDir, 'icons'), path.join(distDir, 'icons'))

    // 5. 复制public目录中的必要文件
    console.log('📦 复制公共资源...')
    const publicDir = path.join(rootDir, 'public')
    const publicFiles = ['workers', 'logo.png'] // 需要的公共文件

    for (const file of publicFiles) {
      const sourcePath = path.join(publicDir, file)
      const destPath = path.join(distDir, file)

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath)
      }
    }

    // 6. 注意: 扩展使用新标签页模式，不需要popup.html
    console.log('⚡ 扩展配置为新标签页模式，跳过popup.html生成')

    // 7. 验证扩展文件
    console.log('✅ 验证扩展文件...')
    await validateExtension(distDir)

    // 8. 生成扩展包
    console.log('📦 打包扩展...')
    await createExtensionZip(distDir)

    console.log('🎉 Chrome扩展构建完成！')
    console.log(`📁 输出目录: ${distDir}`)
    console.log(`📦 扩展包: ${path.join(rootDir, 'kit-extension.zip')}`)
  } catch (error) {
    console.error('❌ 构建失败:', error)
    process.exit(1)
  }
}

// generatePopupHtml函数已删除 - 扩展使用新标签页模式，不需要popup.html

async function validateExtension(distDir) {
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'icons/icon16.png',
    'icons/icon48.png',
    'icons/icon128.png',
  ]

  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file)
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`缺少必要文件: ${file}`)
    }
  }

  // 验证manifest.json格式
  const manifestPath = path.join(distDir, 'manifest.json')
  const manifest = await fs.readJson(manifestPath)

  if (!manifest.manifest_version || manifest.manifest_version !== 3) {
    throw new Error('manifest.json 必须使用 Manifest V3')
  }

  if (!manifest.name || !manifest.version) {
    throw new Error('manifest.json 缺少必要字段')
  }

  console.log('✅ 所有必要文件都存在')
}

async function createExtensionZip(distDir) {
  const archiver = await import('archiver')
  const output = fs.createWriteStream(path.join(rootDir, 'kit-extension.zip'))
  const archive = archiver.default('zip', { zlib: { level: 9 } })

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`📦 扩展包大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
      resolve()
    })

    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(distDir, false)
    archive.finalize()
  })
}

// 添加命令行帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Chrome扩展构建脚本

用法:
  npm run build:extension
  node scripts/build-extension.mjs

选项:
  --help, -h    显示帮助信息

输出:
  dist-extension/       扩展文件目录
  kit-extension.zip     可安装的扩展包
`)
  process.exit(0)
}

// 执行构建
buildExtension()
