#!/usr/bin/env node

import { readFile, writeFile, stat, readdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { gzipSync } from 'node:zlib'

/**
 * 构建优化脚本
 * 用于分析和优化构建产物，减小应用体积
 */

const DIST_DIR = 'dist'
const TARGET_DIR = 'src-tauri/target/release'

/**
 * 格式化文件大小
 */
const formatSize = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * 分析文件大小
 */
const analyzeFileSize = async (filePath) => {
  try {
    const stats = await stat(filePath)
    const content = await readFile(filePath)
    const gzipSize = gzipSync(content).length
    
    return {
      path: filePath,
      size: stats.size,
      gzipSize,
      compression: ((stats.size - gzipSize) / stats.size * 100).toFixed(1)
    }
  } catch (error) {
    return null
  }
}

/**
 * 递归分析目录
 */
const analyzeDirectory = async (dirPath, results = []) => {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        await analyzeDirectory(fullPath, results)
      } else {
        const analysis = await analyzeFileSize(fullPath)
        if (analysis) {
          results.push(analysis)
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ 无法分析目录 ${dirPath}:`, error.message)
  }
  
  return results
}

/**
 * 生成构建报告
 */
const generateBuildReport = async () => {
  console.log('📊 开始分析构建产物...')
  
  const frontendFiles = await analyzeDirectory(DIST_DIR)
  const backendFiles = await analyzeDirectory(TARGET_DIR)
  
  const allFiles = [...frontendFiles, ...backendFiles]
  
  // 按文件大小排序
  allFiles.sort((a, b) => b.size - a.size)
  
  const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0)
  const totalGzipSize = allFiles.reduce((sum, file) => sum + file.gzipSize, 0)
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: allFiles.length,
      totalSize: formatSize(totalSize),
      totalGzipSize: formatSize(totalGzipSize),
      compressionRatio: ((totalSize - totalGzipSize) / totalSize * 100).toFixed(1) + '%'
    },
    frontend: {
      files: frontendFiles.length,
      size: formatSize(frontendFiles.reduce((sum, f) => sum + f.size, 0)),
      gzipSize: formatSize(frontendFiles.reduce((sum, f) => sum + f.gzipSize, 0))
    },
    backend: {
      files: backendFiles.length,
      size: formatSize(backendFiles.reduce((sum, f) => sum + f.size, 0)),
      gzipSize: formatSize(backendFiles.reduce((sum, f) => sum + f.gzipSize, 0))
    },
    largestFiles: allFiles.slice(0, 10).map(file => ({
      path: file.path.replace(process.cwd() + '/', ''),
      size: formatSize(file.size),
      gzipSize: formatSize(file.gzipSize),
      compression: file.compression + '%'
    })),
    fileTypes: {}
  }
  
  // 按文件类型分组
  for (const file of allFiles) {
    const ext = extname(file.path) || 'no-extension'
    if (!report.fileTypes[ext]) {
      report.fileTypes[ext] = {
        count: 0,
        totalSize: 0,
        totalGzipSize: 0
      }
    }
    
    report.fileTypes[ext].count++
    report.fileTypes[ext].totalSize += file.size
    report.fileTypes[ext].totalGzipSize += file.gzipSize
  }
  
  // 格式化文件类型统计
  for (const [ext, stats] of Object.entries(report.fileTypes)) {
    stats.totalSize = formatSize(stats.totalSize)
    stats.totalGzipSize = formatSize(stats.totalGzipSize)
  }
  
  return report
}

/**
 * 输出优化建议
 */
const generateOptimizationSuggestions = (report) => {
  const suggestions = []
  
  // 检查大文件
  const largeFiles = report.largestFiles.filter(file => {
    const sizeInMB = parseFloat(file.size.split(' ')[0])
    return file.size.includes('MB') && sizeInMB > 1
  })
  
  if (largeFiles.length > 0) {
    suggestions.push({
      type: 'warning',
      title: '大文件检测',
      description: `发现 ${largeFiles.length} 个大于 1MB 的文件，建议进行代码分割或资源优化`,
      files: largeFiles.map(f => f.path)
    })
  }
  
  // 检查压缩率
  const lowCompressionFiles = report.largestFiles.filter(file => {
    const compression = parseFloat(file.compression)
    return compression < 30
  })
  
  if (lowCompressionFiles.length > 0) {
    suggestions.push({
      type: 'info',
      title: '压缩优化',
      description: '以下文件压缩率较低，可能已经是压缩格式或可以进一步优化',
      files: lowCompressionFiles.map(f => f.path)
    })
  }
  
  // 检查文件类型分布
  const jsFiles = report.fileTypes['.js'] || { count: 0 }
  const cssFiles = report.fileTypes['.css'] || { count: 0 }
  
  if (jsFiles.count > 20) {
    suggestions.push({
      type: 'warning',
      title: 'JavaScript 文件过多',
      description: `发现 ${jsFiles.count} 个 JS 文件，建议使用代码分割和懒加载优化`
    })
  }
  
  if (cssFiles.count > 10) {
    suggestions.push({
      type: 'info',
      title: 'CSS 文件优化',
      description: `发现 ${cssFiles.count} 个 CSS 文件，建议合并和压缩`
    })
  }
  
  return suggestions
}

/**
 * 主函数
 */
const main = async () => {
  try {
    console.log('🔧 Kit 构建优化器')
    console.log('==================')
    
    const report = await generateBuildReport()
    const suggestions = generateOptimizationSuggestions(report)
    
    // 输出报告
    console.log('\n📊 构建统计:')
    console.log(`总文件数: ${report.summary.totalFiles}`)
    console.log(`总大小: ${report.summary.totalSize}`)
    console.log(`压缩后: ${report.summary.totalGzipSize}`)
    console.log(`压缩率: ${report.summary.compressionRatio}`)
    
    console.log('\n🎯 前端资源:')
    console.log(`文件数: ${report.frontend.files}`)
    console.log(`大小: ${report.frontend.size}`)
    console.log(`压缩后: ${report.frontend.gzipSize}`)
    
    console.log('\n⚙️ 后端资源:')
    console.log(`文件数: ${report.backend.files}`)
    console.log(`大小: ${report.backend.size}`)
    console.log(`压缩后: ${report.backend.gzipSize}`)
    
    console.log('\n📁 最大文件 (前10):')
    report.largestFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.path} - ${file.size} (压缩: ${file.gzipSize})`)
    })
    
    if (suggestions.length > 0) {
      console.log('\n💡 优化建议:')
      suggestions.forEach((suggestion, index) => {
        const icon = suggestion.type === 'warning' ? '⚠️' : 'ℹ️'
        console.log(`${icon} ${suggestion.title}: ${suggestion.description}`)
        if (suggestion.files) {
          suggestion.files.forEach(file => console.log(`   - ${file}`))
        }
      })
    }
    
    // 保存详细报告
    await writeFile('build-report.json', JSON.stringify(report, null, 2))
    console.log('\n📄 详细报告已保存到 build-report.json')
    
    console.log('\n✅ 构建分析完成!')
    
  } catch (error) {
    console.error('❌ 构建分析失败:', error)
    process.exit(1)
  }
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { generateBuildReport, generateOptimizationSuggestions }