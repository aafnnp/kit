#!/usr/bin/env node

/**
 * CRX打包脚本
 * 用于将Chrome扩展打包成CRX文件（需要私钥）
 */

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function packCRX() {
  console.log('📦 开始打包CRX文件...')

  try {
    const distDir = path.join(rootDir, 'dist-extension')
    const outputDir = path.join(rootDir, 'releases')

    // 确保目录存在
    await fs.ensureDir(outputDir)

    // 检查构建文件是否存在
    if (!(await fs.pathExists(distDir))) {
      throw new Error('dist-extension目录不存在，请先运行构建命令')
    }

    // 检查manifest.json
    const manifestPath = path.join(distDir, 'manifest.json')
    if (!(await fs.pathExists(manifestPath))) {
      throw new Error('manifest.json文件不存在')
    }

    const manifest = await fs.readJson(manifestPath)
    const version = manifest.version

    console.log(`📋 扩展版本: ${version}`)
    console.log(`📋 扩展名称: ${manifest.name}`)

    // 输出文件路径
    const crxFileName = `kit-extension-v${version}.crx`
    const zipFileName = `kit-extension-v${version}.zip`
    const crxFilePath = path.join(outputDir, crxFileName)
    const zipFilePath = path.join(outputDir, zipFileName)

    // 方式1: 使用chrome-webstore-upload-cli (如果有私钥)
    const privateKeyPath = path.join(rootDir, 'private-key.pem')

    if (await fs.pathExists(privateKeyPath)) {
      console.log('🔐 发现私钥文件，生成签名CRX...')

      try {
        // 使用crx3包来生成CRX
        const crx3 = require('crx3')

        const privateKey = await fs.readFile(privateKeyPath)
        const files = await getDirectoryFiles(distDir)

        const crxBuffer = await crx3(files, {
          keyPath: privateKeyPath,
        })

        await fs.writeFile(crxFilePath, crxBuffer)
        console.log(`✅ CRX文件已生成: ${crxFilePath}`)
      } catch (error) {
        console.warn('⚠️ CRX生成失败，将生成ZIP包:', error.message)
      }
    } else {
      console.log('📝 未找到私钥文件，将生成未签名的ZIP包')
    }

    // 方式2: 生成ZIP包（总是执行）
    console.log('📦 生成ZIP包...')

    const archiver = require('archiver')
    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 }, // 最高压缩级别
    })

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2)
        console.log(`✅ ZIP包已生成: ${zipFilePath}`)
        console.log(`📊 包大小: ${sizeInMB} MB`)

        // 生成发布信息
        generateReleaseInfo(version, manifest, outputDir, {
          crxFile: fs.existsSync(crxFilePath) ? crxFileName : null,
          zipFile: zipFileName,
          size: sizeInMB,
        })

        resolve()
      })

      output.on('error', reject)
      archive.on('error', reject)

      archive.pipe(output)
      archive.directory(distDir, false)
      archive.finalize()
    })
  } catch (error) {
    console.error('❌ CRX打包失败:', error)
    process.exit(1)
  }
}

async function getDirectoryFiles(dir) {
  const files = {}

  async function readDir(currentDir, relativePath = '') {
    const items = await fs.readdir(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const itemRelativePath = path.join(relativePath, item)
      const stat = await fs.stat(fullPath)

      if (stat.isDirectory()) {
        await readDir(fullPath, itemRelativePath)
      } else {
        files[itemRelativePath] = await fs.readFile(fullPath)
      }
    }
  }

  await readDir(dir)
  return files
}

async function generateReleaseInfo(version, manifest, outputDir, files) {
  const releaseInfo = {
    version,
    name: manifest.name,
    description: manifest.description,
    buildTime: new Date().toISOString(),
    files: {
      crx: files.crxFile,
      zip: files.zipFile,
    },
    size: files.size,
    manifest: {
      version: manifest.manifest_version,
      permissions: manifest.permissions,
      hostPermissions: manifest.host_permissions,
    },
    installation: {
      developer: {
        steps: [
          '1. 下载ZIP文件并解压',
          '2. 打开Chrome浏览器，访问 chrome://extensions/',
          "3. 启用右上角的'开发者模式'",
          "4. 点击'加载已解压的扩展程序'",
          '5. 选择解压后的文件夹',
        ],
      },
      crx: files.crxFile
        ? {
            steps: ['1. 下载CRX文件', '2. 将CRX文件拖拽到Chrome扩展管理页面', '3. 确认安装'],
          }
        : null,
    },
  }

  const infoFilePath = path.join(outputDir, `release-info-v${version}.json`)
  await fs.writeJson(infoFilePath, releaseInfo, { spaces: 2 })

  console.log(`📋 发布信息已生成: ${infoFilePath}`)
}

// 检查是否需要安装依赖
async function checkDependencies() {
  const packageJsonPath = path.join(rootDir, 'package.json')
  const packageJson = await fs.readJson(packageJsonPath)

  const requiredDeps = ['archiver']
  const missingDeps = []

  for (const dep of requiredDeps) {
    try {
      require.resolve(dep)
    } catch {
      missingDeps.push(dep)
    }
  }

  if (missingDeps.length > 0) {
    console.log('📦 检测到缺少依赖，正在安装...')
    console.log(`缺少: ${missingDeps.join(', ')}`)

    const { execSync } = require('child_process')
    try {
      execSync(`npm install ${missingDeps.join(' ')}`, {
        stdio: 'inherit',
        cwd: rootDir,
      })
    } catch (error) {
      console.error('❌ 依赖安装失败:', error)
      process.exit(1)
    }
  }
}

// 主函数
async function main() {
  await checkDependencies()
  await packCRX()
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { packCRX }
