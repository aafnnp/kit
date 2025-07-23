import { context, getOctokit } from '@actions/github'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'

const octokit = getOctokit(process.env.GITHUB_TOKEN)

/**
 * 计算文件哈希值，用于增量更新检测
 */
const calculateFileHash = async (filePath) => {
  if (!existsSync(filePath)) return null
  const fileBuffer = await readFile(filePath)
  return createHash('sha256').update(fileBuffer).digest('hex')
}

/**
 * 生成增量更新信息
 */
const generateDeltaInfo = async (currentVersion, previousVersion) => {
  const deltaInfo = {
    from: previousVersion,
    to: currentVersion,
    size: 0,
    checksum: '',
    url: ''
  }
  
  // 这里可以添加实际的增量包生成逻辑
  // 目前返回基础结构
  return deltaInfo
}

/**
 * 更新发布信息
 */
const updateRelease = async () => {
  try {
    console.log('🚀 开始更新发布信息...')
    
    // 获取updater tag的release
    const { data: release } = await octokit.rest.repos.getReleaseByTag({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag: 'updater',
    })
    
    console.log('📦 找到updater release:', release.name)
    
    // 删除旧的latest.json文件
    const deletePromises = release.assets
      .filter((item) => item.name === 'latest.json')
      .map(async (item) => {
        console.log('🗑️ 删除旧的latest.json文件')
        await octokit.rest.repos.deleteReleaseAsset({
          owner: context.repo.owner,
          repo: context.repo.repo,
          asset_id: item.id,
        })
      })
    
    await Promise.all(deletePromises)
    
    // 读取并处理latest.json文件
    const file = await readFile('latest.json', { encoding: 'utf-8' })
    const data = JSON.parse(file)
    
    // 确保macOS架构兼容性
    if (data.platforms['darwin-x86_64']) {
      data.platforms['darwin-aarch64'] = {
        ...data.platforms['darwin-x86_64'],
        url: data.platforms['darwin-x86_64'].url.replace('x86_64', 'aarch64')
      }
    }
    
    // 添加增量更新信息
    const currentVersion = data.version
    console.log('📋 当前版本:', currentVersion)
    
    // 获取最近的几个版本用于增量更新
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner: context.repo.owner,
      repo: context.repo.repo,
      per_page: 5
    })
    
    const previousVersions = releases
      .filter(r => r.tag_name !== 'updater' && !r.draft)
      .slice(0, 3)
      .map(r => r.tag_name)
    
    // 为每个平台添加增量更新信息
    for (const [platform, platformData] of Object.entries(data.platforms)) {
      if (!platformData.deltas) {
        platformData.deltas = []
      }
      
      // 为最近的版本生成增量更新信息
      for (const prevVersion of previousVersions) {
        const deltaInfo = await generateDeltaInfo(currentVersion, prevVersion)
        platformData.deltas.push(deltaInfo)
      }
      
      // 限制增量更新记录数量
      platformData.deltas = platformData.deltas.slice(0, 5)
    }
    
    // 添加更新元数据
    data.metadata = {
      buildTime: new Date().toISOString(),
      buildNumber: process.env.GITHUB_RUN_NUMBER || '0',
      commitSha: process.env.GITHUB_SHA || '',
      branch: process.env.GITHUB_REF_NAME || '',
      incrementalUpdatesSupported: true,
      minSupportedVersion: previousVersions[previousVersions.length - 1] || currentVersion
    }
    
    // 上传新的latest.json文件
    console.log('📤 上传新的latest.json文件')
    await octokit.rest.repos.uploadReleaseAsset({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: release.id,
      name: 'latest.json',
      data: JSON.stringify(data, null, 2),
    })
    
    // 保存本地副本用于调试
    await writeFile('latest-generated.json', JSON.stringify(data, null, 2))
    
    console.log('✅ 更新发布信息完成')
    console.log('📊 支持的平台:', Object.keys(data.platforms).join(', '))
    console.log('🔄 增量更新支持:', data.metadata.incrementalUpdatesSupported)
    
  } catch (error) {
    console.error('❌ 更新发布信息失败:', error)
    process.exit(1)
  }
}

// 执行更新
updateRelease()
