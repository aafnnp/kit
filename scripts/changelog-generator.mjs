import { execSync } from 'node:child_process'
import { writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

/**
 * 自动生成更新日志脚本
 * 基于Git提交历史和标签生成结构化的更新日志
 */

// 提交类型映射
const COMMIT_TYPES = {
  feat: { emoji: '✨', label: '新功能', section: 'Features' },
  fix: { emoji: '🐛', label: '修复', section: 'Bug Fixes' },
  docs: { emoji: '📚', label: '文档', section: 'Documentation' },
  style: { emoji: '💄', label: '样式', section: 'Styles' },
  refactor: { emoji: '♻️', label: '重构', section: 'Code Refactoring' },
  perf: { emoji: '⚡', label: '性能', section: 'Performance Improvements' },
  test: { emoji: '✅', label: '测试', section: 'Tests' },
  build: { emoji: '👷', label: '构建', section: 'Build System' },
  ci: { emoji: '💚', label: 'CI', section: 'Continuous Integration' },
  chore: { emoji: '🔧', label: '杂项', section: 'Chores' },
  revert: { emoji: '⏪', label: '回滚', section: 'Reverts' }
}

/**
 * 获取Git标签列表
 */
function getGitTags() {
  try {
    const output = execSync('git tag --sort=-version:refname', { encoding: 'utf-8' })
    return output.trim().split('\n').filter(tag => tag.trim())
  } catch (error) {
    console.warn('⚠️ 无法获取Git标签:', error.message)
    return []
  }
}

/**
 * 获取两个标签之间的提交记录
 */
function getCommitsBetweenTags(fromTag, toTag) {
  try {
    const range = fromTag ? `${fromTag}..${toTag || 'HEAD'}` : toTag || 'HEAD'
    const output = execSync(
      `git log ${range} --pretty=format:"%H%n%s%n%an%n%ad%n%b%n---COMMIT-END---" --date=short --no-merges`,
      { encoding: 'utf-8' }
    )
    
    if (!output.trim()) return []
    
    return output.trim().split('---COMMIT-END---').map(commitBlock => {
      const lines = commitBlock.trim().split('\n')
      if (lines.length < 4) return null
      
      const hash = lines[0]?.trim()
      const subject = lines[1]?.trim()
      const author = lines[2]?.trim()
      const date = lines[3]?.trim()
      const body = lines.slice(4).join('\n').trim()
      
      if (!hash || !subject) return null
      
      return {
        hash,
        subject,
        author,
        date,
        body
      }
    }).filter(commit => commit !== null)
  } catch (error) {
    console.warn(`⚠️ 无法获取提交记录 (${fromTag} -> ${toTag}):`, error.message)
    return []
  }
}

/**
 * 解析提交信息
 */
function parseCommit(commit) {
  const { subject, hash, author, date, body } = commit
  
  // 检查必要字段
  if (!subject || !hash) {
    console.warn('⚠️ 跳过无效提交:', commit)
    return null
  }
  
  // 匹配 Conventional Commits 格式: type(scope): description
  const conventionalMatch = subject.match(/^(\w+)(\([^)]+\))?!?:\s*(.+)$/)
  
  if (conventionalMatch) {
    const [, type, scope, description] = conventionalMatch
    const typeInfo = COMMIT_TYPES[type.toLowerCase()] || COMMIT_TYPES.chore
    
    return {
      type: type.toLowerCase(),
      scope: scope ? scope.slice(1, -1) : null,
      description,
      emoji: typeInfo.emoji,
      section: typeInfo.section,
      hash: hash.substring(0, 7),
      author: author || 'Unknown',
      date: date || new Date().toISOString().split('T')[0],
      body: body || '',
      breaking: subject.includes('!') || (body && body.includes('BREAKING CHANGE'))
    }
  }
  
  // 尝试从描述中推断类型
  const lowerSubject = subject.toLowerCase()
  let inferredType = 'chore'
  
  if (lowerSubject.includes('fix') || lowerSubject.includes('bug')) {
    inferredType = 'fix'
  } else if (lowerSubject.includes('add') || lowerSubject.includes('feat')) {
    inferredType = 'feat'
  } else if (lowerSubject.includes('update') || lowerSubject.includes('improve')) {
    inferredType = 'perf'
  } else if (lowerSubject.includes('doc')) {
    inferredType = 'docs'
  }
  
  const typeInfo = COMMIT_TYPES[inferredType]
  
  return {
    type: inferredType,
    scope: null,
    description: subject,
    emoji: typeInfo.emoji,
    section: typeInfo.section,
    hash: hash.substring(0, 7),
    author: author || 'Unknown',
    date: date || new Date().toISOString().split('T')[0],
    body: body || '',
    breaking: false
  }
}

/**
 * 生成版本的更新日志
 */
function generateVersionChangelog(version, commits, previousVersion) {
  if (!commits.length) {
    return `## ${version}\n\n*暂无更新内容*\n\n`
  }
  
  const parsedCommits = commits.map(parseCommit).filter(c => c !== null)
  const breakingChanges = parsedCommits.filter(c => c.breaking)
  
  // 按类型分组
  const groupedCommits = {}
  parsedCommits.forEach(commit => {
    if (!groupedCommits[commit.section]) {
      groupedCommits[commit.section] = []
    }
    groupedCommits[commit.section].push(commit)
  })
  
  let changelog = `## ${version}\n\n`
  
  // 添加发布日期
  const releaseDate = commits[0]?.date || new Date().toISOString().split('T')[0]
  changelog += `*发布日期: ${releaseDate}*\n\n`
  
  // 添加重大变更
  if (breakingChanges.length > 0) {
    changelog += `### ⚠️ 重大变更\n\n`
    breakingChanges.forEach(commit => {
      changelog += `- **${commit.description}** ([${commit.hash}](../../commit/${commit.hash}))\n`
      if (commit.body && commit.body.includes('BREAKING CHANGE')) {
        const breakingNote = commit.body.split('BREAKING CHANGE:')[1]?.trim()
        if (breakingNote) {
          changelog += `  ${breakingNote}\n`
        }
      }
    })
    changelog += '\n'
  }
  
  // 按重要性排序的部分
  const sectionOrder = [
    'Features',
    'Bug Fixes', 
    'Performance Improvements',
    'Code Refactoring',
    'Documentation',
    'Styles',
    'Tests',
    'Build System',
    'Continuous Integration',
    'Chores',
    'Reverts'
  ]
  
  sectionOrder.forEach(sectionName => {
    const sectionCommits = groupedCommits[sectionName]
    if (sectionCommits && sectionCommits.length > 0) {
      changelog += `### ${sectionCommits[0].emoji} ${sectionName}\n\n`
      
      sectionCommits.forEach(commit => {
        const scopeText = commit.scope ? `**${commit.scope}**: ` : ''
        changelog += `- ${scopeText}${commit.description} ([${commit.hash}](../../commit/${commit.hash}))\n`
      })
      changelog += '\n'
    }
  })
  
  // 添加统计信息
  const stats = {
    total: commits.length,
    authors: [...new Set(commits.map(c => c.author))].length,
    features: (groupedCommits['Features'] || []).length,
    fixes: (groupedCommits['Bug Fixes'] || []).length
  }
  
  changelog += `### 📊 统计信息\n\n`
  changelog += `- 总提交数: ${stats.total}\n`
  changelog += `- 参与开发者: ${stats.authors}\n`
  changelog += `- 新功能: ${stats.features}\n`
  changelog += `- 问题修复: ${stats.fixes}\n`
  
  if (previousVersion) {
    changelog += `- 对比版本: [${previousVersion}...${version}](../../compare/${previousVersion}...${version})\n`
  }
  
  changelog += '\n---\n\n'
  
  return changelog
}

/**
 * 生成完整的更新日志
 */
async function generateChangelog() {
  console.log('🚀 开始生成更新日志...')
  
  try {
    // 获取所有标签
    const tags = getGitTags()
    console.log(`📋 找到 ${tags.length} 个版本标签`)
    
    let fullChangelog = `# 更新日志\n\n`
    fullChangelog += `本文档记录了项目的所有重要变更。\n\n`
    fullChangelog += `格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，\n`
    fullChangelog += `版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。\n\n`
    
    if (tags.length === 0) {
      // 没有标签，生成从初始提交到现在的日志
      console.log('📝 没有找到版本标签，生成完整提交历史')
      const commits = getCommitsBetweenTags(null, 'HEAD')
      const currentVersion = 'v0.0.1-unreleased'
      fullChangelog += generateVersionChangelog(currentVersion, commits, null)
    } else {
      // 生成未发布的更改（如果有）
      const latestTag = tags[0]
      const unreleased = getCommitsBetweenTags(latestTag, 'HEAD')
      
      if (unreleased.length > 0) {
        console.log(`📝 生成未发布更改 (${unreleased.length} 个提交)`)
        fullChangelog += generateVersionChangelog('[Unreleased]', unreleased, latestTag)
      }
      
      // 生成每个版本的日志
      for (let i = 0; i < tags.length; i++) {
        const currentTag = tags[i]
        const previousTag = tags[i + 1]
        const commits = getCommitsBetweenTags(previousTag, currentTag)
        
        console.log(`📝 生成版本 ${currentTag} (${commits.length} 个提交)`)
        fullChangelog += generateVersionChangelog(currentTag, commits, previousTag)
      }
    }
    
    // 写入文件
    const changelogPath = 'CHANGELOG.md'
    await writeFile(changelogPath, fullChangelog, 'utf-8')
    
    console.log(`✅ 更新日志已生成: ${changelogPath}`)
    console.log(`📄 文件大小: ${(fullChangelog.length / 1024).toFixed(2)} KB`)
    
    return changelogPath
    
  } catch (error) {
    console.error('❌ 生成更新日志失败:', error)
    throw error
  }
}

/**
 * 生成发布说明（用于GitHub Release）
 */
async function generateReleaseNotes(version) {
  console.log(`🏷️ 生成版本 ${version} 的发布说明...`)
  
  try {
    const tags = getGitTags()
    const currentTagIndex = tags.indexOf(version)
    
    if (currentTagIndex === -1) {
      throw new Error(`版本标签 ${version} 不存在`)
    }
    
    const previousTag = tags[currentTagIndex + 1]
    const commits = getCommitsBetweenTags(previousTag, version)
    
    if (commits.length === 0) {
      return `## ${version}\n\n*此版本暂无更新内容*`
    }
    
    const parsedCommits = commits.map(parseCommit).filter(c => c !== null)
    const features = parsedCommits.filter(c => c.type === 'feat')
    const fixes = parsedCommits.filter(c => c.type === 'fix')
    const breaking = parsedCommits.filter(c => c.breaking)
    
    let releaseNotes = `## 🚀 Kit ${version}\n\n`
    
    // 重大变更
    if (breaking.length > 0) {
      releaseNotes += `### ⚠️ 重大变更\n\n`
      breaking.forEach(commit => {
        releaseNotes += `- ${commit.description}\n`
      })
      releaseNotes += '\n'
    }
    
    // 新功能
    if (features.length > 0) {
      releaseNotes += `### ✨ 新功能\n\n`
      features.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : ''
        releaseNotes += `- ${scope}${commit.description}\n`
      })
      releaseNotes += '\n'
    }
    
    // 问题修复
    if (fixes.length > 0) {
      releaseNotes += `### 🐛 问题修复\n\n`
      fixes.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : ''
        releaseNotes += `- ${scope}${commit.description}\n`
      })
      releaseNotes += '\n'
    }
    
    // 其他改进
    const others = parsedCommits.filter(c => 
      !['feat', 'fix'].includes(c.type) && !c.breaking
    )
    
    if (others.length > 0) {
      releaseNotes += `### 🔧 其他改进\n\n`
      others.slice(0, 10).forEach(commit => { // 限制显示数量
        releaseNotes += `- ${commit.emoji} ${commit.description}\n`
      })
      if (others.length > 10) {
        releaseNotes += `- 以及其他 ${others.length - 10} 项改进...\n`
      }
      releaseNotes += '\n'
    }
    
    // 统计信息
    releaseNotes += `### 📊 本次更新\n\n`
    releaseNotes += `- 🔢 总计 ${commits.length} 个提交\n`
    releaseNotes += `- 👥 ${[...new Set(commits.map(c => c.author))].length} 位开发者参与\n`
    releaseNotes += `- ✨ ${features.length} 个新功能\n`
    releaseNotes += `- 🐛 ${fixes.length} 个问题修复\n`
    
    if (previousTag) {
      releaseNotes += `\n**完整变更**: [${previousTag}...${version}](https://github.com/aafnnp/kit/compare/${previousTag}...${version})\n`
    }
    
    return releaseNotes
    
  } catch (error) {
    console.error('❌ 生成发布说明失败:', error)
    throw error
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  try {
    switch (command) {
      case 'generate':
        await generateChangelog()
        break
        
      case 'release-notes':
        const version = args[1]
        if (!version) {
          console.error('❌ 请提供版本号: npm run changelog release-notes v1.0.0')
          process.exit(1)
        }
        const notes = await generateReleaseNotes(version)
        console.log('\n' + notes)
        break
        
      default:
        console.log(`
📋 更新日志生成器

用法:
  npm run changelog generate          # 生成完整更新日志
  npm run changelog release-notes <version>  # 生成指定版本的发布说明

示例:
  npm run changelog generate
  npm run changelog release-notes v1.0.0
`)
        break
    }
  } catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { generateChangelog, generateReleaseNotes }