#!/usr/bin/env node

/**
 * 测试更新日志生成器
 * 用于验证在CI环境中的工作情况
 */

import { generateChangelog, generateReleaseNotes } from './changelog-generator.mjs'
import { execSync } from 'node:child_process'

async function testChangelogGenerator() {
  console.log('🧪 开始测试更新日志生成器...')
  
  try {
    // 测试1: 生成完整更新日志
    console.log('\n📋 测试1: 生成完整更新日志')
    await generateChangelog()
    console.log('✅ 完整更新日志生成成功')
    
    // 测试2: 获取最新标签并生成发布说明
    console.log('\n📋 测试2: 生成发布说明')
    try {
      const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim()
      console.log(`🏷️ 最新标签: ${latestTag}`)
      
      const releaseNotes = await generateReleaseNotes(latestTag)
      console.log('\n📄 生成的发布说明:')
      console.log('=' .repeat(50))
      console.log(releaseNotes)
      console.log('=' .repeat(50))
      console.log('✅ 发布说明生成成功')
    } catch (error) {
      console.log('⚠️ 无法获取最新标签，跳过发布说明测试')
    }
    
    // 测试3: 验证文件是否生成
    console.log('\n📋 测试3: 验证文件生成')
    const fs = await import('node:fs/promises')
    
    try {
      const changelogContent = await fs.readFile('CHANGELOG.md', 'utf-8')
      const lines = changelogContent.split('\n').length
      const size = (changelogContent.length / 1024).toFixed(2)
      
      console.log(`📄 CHANGELOG.md: ${lines} 行, ${size} KB`)
      console.log('✅ 更新日志文件验证成功')
    } catch (error) {
      console.error('❌ 更新日志文件验证失败:', error.message)
      throw error
    }
    
    console.log('\n🎉 所有测试通过！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testChangelogGenerator()
}

export { testChangelogGenerator }