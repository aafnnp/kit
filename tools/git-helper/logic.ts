import type { Localized } from "../../lib/types"

export type GitCommandCategory = "basic" | "staging" | "branch" | "remote" | "history"

export interface GitCommand {
  id: string
  category: GitCommandCategory
  name: Localized
  description: Localized
  command: string
}

export const gitCategories: Array<{ id: GitCommandCategory; name: Localized }> = [
  { id: "basic", name: { zh: "基础", en: "Basics" } },
  { id: "staging", name: { zh: "暂存与提交", en: "Staging" } },
  { id: "branch", name: { zh: "分支", en: "Branches" } },
  { id: "remote", name: { zh: "远程仓库", en: "Remotes" } },
  { id: "history", name: { zh: "历史与差异", en: "History & diff" } },
]

export const gitCommands: GitCommand[] = [
  {
    id: "init",
    category: "basic",
    name: { zh: "初始化仓库", en: "Initialize a repository" },
    description: { zh: "在当前目录创建 Git 仓库。", en: "Create a Git repository in the current directory." },
    command: "git init",
  },
  {
    id: "status",
    category: "basic",
    name: { zh: "查看状态", en: "Check status" },
    description: { zh: "查看工作区与暂存区的更改。", en: "Inspect working tree and staged changes." },
    command: "git status",
  },
  {
    id: "clone",
    category: "basic",
    name: { zh: "克隆仓库", en: "Clone a repository" },
    description: { zh: "将远程仓库复制到本地。", en: "Copy a remote repository locally." },
    command: "git clone <repository-url>",
  },
  {
    id: "add",
    category: "staging",
    name: { zh: "暂存文件", en: "Stage files" },
    description: { zh: "将指定文件的更改加入下一次提交。", en: "Stage changes from a specific file for the next commit." },
    command: "git add <file>",
  },
  {
    id: "add-all",
    category: "staging",
    name: { zh: "暂存所有更改", en: "Stage all changes" },
    description: { zh: "暂存当前目录下所有已跟踪和未跟踪的更改。", en: "Stage all tracked and untracked changes in the current directory." },
    command: "git add -A",
  },
  {
    id: "commit",
    category: "staging",
    name: { zh: "创建提交", en: "Create a commit" },
    description: { zh: "使用简短、清晰的说明记录暂存内容。", en: "Record staged changes with a concise message." },
    command: 'git commit -m "<message>"',
  },
  {
    id: "branch-list",
    category: "branch",
    name: { zh: "列出本地分支", en: "List local branches" },
    description: { zh: "查看本地分支并标出当前分支。", en: "List local branches and identify the current one." },
    command: "git branch",
  },
  {
    id: "branch-create",
    category: "branch",
    name: { zh: "创建并切换分支", en: "Create and switch branches" },
    description: { zh: "创建新分支并立即切换过去。", en: "Create a new branch and switch to it." },
    command: "git switch -c <branch>",
  },
  {
    id: "branch-switch",
    category: "branch",
    name: { zh: "切换分支", en: "Switch branches" },
    description: { zh: "切换到已有分支。", en: "Switch to an existing branch." },
    command: "git switch <branch>",
  },
  {
    id: "merge",
    category: "branch",
    name: { zh: "合并分支", en: "Merge a branch" },
    description: { zh: "将指定分支合并到当前分支。", en: "Merge the specified branch into the current branch." },
    command: "git merge <branch>",
  },
  {
    id: "remote-list",
    category: "remote",
    name: { zh: "查看远程仓库", en: "List remotes" },
    description: { zh: "查看远程名称及其 URL。", en: "Show remote names and their URLs." },
    command: "git remote -v",
  },
  {
    id: "fetch",
    category: "remote",
    name: { zh: "获取远程更新", en: "Fetch remote updates" },
    description: { zh: "下载远程引用和对象，不自动合并。", en: "Download remote refs and objects without merging." },
    command: "git fetch",
  },
  {
    id: "pull",
    category: "remote",
    name: { zh: "快进式拉取", en: "Pull with fast-forward only" },
    description: { zh: "仅在可以快进时整合远程更新。", en: "Integrate remote updates only when a fast-forward is possible." },
    command: "git pull --ff-only",
  },
  {
    id: "push",
    category: "remote",
    name: { zh: "推送并设置上游", en: "Push and set upstream" },
    description: { zh: "推送当前分支并设置其远程跟踪分支。", en: "Push the current branch and set its upstream." },
    command: "git push -u origin <branch>",
  },
  {
    id: "diff",
    category: "history",
    name: { zh: "查看未暂存差异", en: "Review unstaged changes" },
    description: { zh: "查看工作区相对暂存区的差异。", en: "Compare working tree changes with the staging area." },
    command: "git diff",
  },
  {
    id: "diff-staged",
    category: "history",
    name: { zh: "查看已暂存差异", en: "Review staged changes" },
    description: { zh: "查看已暂存、即将提交的差异。", en: "Review staged changes before committing." },
    command: "git diff --staged",
  },
  {
    id: "log",
    category: "history",
    name: { zh: "查看提交图", en: "View commit graph" },
    description: { zh: "以紧凑图形形式查看最近十次提交。", en: "View the latest ten commits in a compact graph." },
    command: "git log --oneline --decorate --graph -10",
  },
  {
    id: "show",
    category: "history",
    name: { zh: "查看最近提交", en: "Inspect the latest commit" },
    description: { zh: "查看最近提交的说明、文件与差异统计。", en: "Show the latest commit message, files and change summary." },
    command: "git show --stat",
  },
]

export function searchGitCommands(query: string, category: GitCommandCategory | "all" = "all"): GitCommand[] {
  const normalized = query.trim().toLowerCase()
  return gitCommands.filter((command) => {
    const categoryMatches = category === "all" || command.category === category
    const searchMatches =
      !normalized ||
      [command.name.zh, command.name.en, command.description.zh, command.description.en, command.command]
        .some((value) => value.toLowerCase().includes(normalized))
    return categoryMatches && searchMatches
  })
}
