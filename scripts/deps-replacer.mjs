#!/usr/bin/env node
// 简易依赖替换与 PR 辅助脚本
// 用法示例：
// node scripts/deps-replacer.mjs apply --plan plan.json
// node scripts/deps-replacer.mjs pr --plan plan.json --title "chore: replace heavy deps" --base main

import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=')
      if (v !== undefined) args[k] = v
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) args[k] = argv[++i]
      else args[k] = true
    } else {
      args._.push(a)
    }
  }
  return args
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts })
  if (r.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`)
  }
}

function readPlan(planPath) {
  if (!planPath) throw new Error('Missing --plan <file>')
  const abs = path.isAbsolute(planPath) ? planPath : path.resolve(process.cwd(), planPath)
  if (!existsSync(abs)) throw new Error(`Plan not found: ${abs}`)
  const json = JSON.parse(readFileSync(abs, 'utf-8'))
  if (!Array.isArray(json)) throw new Error('Plan must be an array of { from, to }')
  return json
}

function applyPlan(plan, manager = 'npm') {
  const rmCmd =
    manager === 'pnpm' ? ['pnpm', ['remove']] : manager === 'yarn' ? ['yarn', ['remove']] : ['npm', ['uninstall']]
  const addCmd = manager === 'pnpm' ? ['pnpm', ['add']] : manager === 'yarn' ? ['yarn', ['add']] : ['npm', ['install']]
  const removeList = plan.map((p) => p.from)
  const addList = plan.map((p) => p.to)
  if (removeList.length) run(rmCmd[0], rmCmd[1].concat(removeList))
  if (addList.length) run(addCmd[0], addCmd[1].concat(addList))
}

function ensureCleanGit() {
  const r = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf-8' })
  if (r.status !== 0) throw new Error('git status failed')
  if (r.stdout.trim()) throw new Error('Working tree not clean. Commit or stash changes first.')
}

function createPrBranch(base = 'main') {
  const branch = `chore/deps-replacements-${new Date().toISOString().slice(0, 10)}`
  run('git', ['checkout', base])
  run('git', ['pull', 'origin', base])
  run('git', ['checkout', '-b', branch])
  return branch
}

function commitAndPush(message, branch) {
  run('git', ['add', 'package.json', 'package-lock.json'])
  run('git', ['commit', '-m', message])
  run('git', ['push', '-u', 'origin', branch])
}

async function createGithubPr({ title, body, base = 'main', head }) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!token) {
    console.warn('GITHUB_TOKEN not set, skip PR creation.')
    return
  }
  // 读取 origin url 推断 repo
  const r = spawnSync('git', ['config', '--get', 'remote.origin.url'], { encoding: 'utf-8' })
  if (r.status !== 0) throw new Error('Cannot read origin url')
  const origin = r.stdout.trim()
  const m = origin.match(/[:/]([^/]+)\/([^/.]+)(?:\.git)?$/)
  if (!m) throw new Error(`Unrecognized origin: ${origin}`)
  const owner = m[1]
  const repo = m[2]

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'deps-replacer-script',
    },
    body: JSON.stringify({ title, head, base, body: body || '' }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Create PR failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  console.log(`PR created: ${data.html_url}`)
}

async function main() {
  const args = parseArgs(process.argv)
  const cmd = args._[0]
  const planFile = args.plan
  const manager = args.manager || 'npm'

  if (!cmd || (cmd !== 'apply' && cmd !== 'pr')) {
    console.log(
      'Usage: node scripts/deps-replacer.mjs <apply|pr> --plan plan.json [--manager npm|pnpm|yarn] [--title <t>] [--base main]'
    )
    process.exit(1)
  }

  const plan = readPlan(planFile)

  if (cmd === 'apply') {
    applyPlan(plan, manager)
    console.log('Dependencies replaced successfully.')
    return
  }

  if (cmd === 'pr') {
    ensureCleanGit()
    const base = args.base || 'main'
    const title = args.title || 'chore: replace heavy/unsafe dependencies'
    const branch = createPrBranch(base)
    applyPlan(plan, manager)
    commitAndPush(title, branch)
    await createGithubPr({ title, base, head: branch })
    return
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
