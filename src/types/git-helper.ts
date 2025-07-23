export interface GitCommand {
  id: string
  name: string
  description: string
  command: string
  category: 'basic' | 'branching' | 'remote' | 'history' | 'advanced'
  parameters?: GitParameter[]
  examples?: string[]
  documentation?: string
}

export interface GitParameter {
  name: string
  description: string
  type: 'string' | 'boolean' | 'number' | 'select'
  required: boolean
  defaultValue?: string | number | boolean
  options?: string[]
  placeholder?: string
}

export interface GitRepository {
  id: string
  name: string
  path: string
  branch: string
  status: 'clean' | 'modified' | 'staged' | 'conflict'
  remotes: GitRemote[]
  lastCommit?: GitCommit
  createdAt: number
  updatedAt: number
}

export interface GitRemote {
  name: string
  url: string
  type: 'fetch' | 'push'
}

export interface GitCommit {
  hash: string
  message: string
  author: string
  date: string
  files: string[]
}

export interface GitBranch {
  name: string
  current: boolean
  remote?: string
  lastCommit?: GitCommit
}

export interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: GitFile[]
  modified: GitFile[]
  untracked: GitFile[]
  conflicted: GitFile[]
}

export interface GitFile {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'untracked' | 'conflicted'
  oldPath?: string
}

export interface GitHelperState {
  repositories: GitRepository[]
  activeRepository?: GitRepository
  commands: GitCommand[]
  commandHistory: GitCommandExecution[]
  favorites: string[]
  isExecuting: boolean
  error?: string
}

export interface GitCommandExecution {
  id: string
  command: string
  parameters: Record<string, any>
  output: string
  exitCode: number
  timestamp: number
  duration: number
  repository?: string
}

// 预设的 Git 命令模板
export const GIT_COMMAND_TEMPLATES: GitCommand[] = [
  // 基础命令
  {
    id: 'git-init',
    name: 'Initialize Repository',
    description: 'Initialize a new Git repository',
    command: 'git init',
    category: 'basic',
    examples: ['git init', 'git init my-project']
  },
  {
    id: 'git-clone',
    name: 'Clone Repository',
    description: 'Clone a repository from remote',
    command: 'git clone {url} {directory}',
    category: 'basic',
    parameters: [
      {
        name: 'url',
        description: 'Repository URL',
        type: 'string',
        required: true,
        placeholder: 'https://github.com/user/repo.git'
      },
      {
        name: 'directory',
        description: 'Target directory',
        type: 'string',
        required: false,
        placeholder: 'my-project'
      }
    ],
    examples: [
      'git clone https://github.com/user/repo.git',
      'git clone https://github.com/user/repo.git my-project'
    ]
  },
  {
    id: 'git-status',
    name: 'Check Status',
    description: 'Show the working tree status',
    command: 'git status',
    category: 'basic',
    examples: ['git status', 'git status --short']
  },
  {
    id: 'git-add',
    name: 'Add Files',
    description: 'Add file contents to the index',
    command: 'git add {files}',
    category: 'basic',
    parameters: [
      {
        name: 'files',
        description: 'Files to add',
        type: 'string',
        required: true,
        placeholder: '. or specific files'
      }
    ],
    examples: ['git add .', 'git add file.txt', 'git add src/']
  },
  {
    id: 'git-commit',
    name: 'Commit Changes',
    description: 'Record changes to the repository',
    command: 'git commit -m "{message}"',
    category: 'basic',
    parameters: [
      {
        name: 'message',
        description: 'Commit message',
        type: 'string',
        required: true,
        placeholder: 'Your commit message'
      }
    ],
    examples: [
      'git commit -m "Initial commit"',
      'git commit -m "Fix bug in user authentication"'
    ]
  },
  {
    id: 'git-push',
    name: 'Push Changes',
    description: 'Update remote refs along with associated objects',
    command: 'git push {remote} {branch}',
    category: 'remote',
    parameters: [
      {
        name: 'remote',
        description: 'Remote name',
        type: 'string',
        required: false,
        defaultValue: 'origin',
        placeholder: 'origin'
      },
      {
        name: 'branch',
        description: 'Branch name',
        type: 'string',
        required: false,
        placeholder: 'main'
      }
    ],
    examples: ['git push', 'git push origin main', 'git push -u origin feature-branch']
  },
  {
    id: 'git-pull',
    name: 'Pull Changes',
    description: 'Fetch from and integrate with another repository or branch',
    command: 'git pull {remote} {branch}',
    category: 'remote',
    parameters: [
      {
        name: 'remote',
        description: 'Remote name',
        type: 'string',
        required: false,
        defaultValue: 'origin',
        placeholder: 'origin'
      },
      {
        name: 'branch',
        description: 'Branch name',
        type: 'string',
        required: false,
        placeholder: 'main'
      }
    ],
    examples: ['git pull', 'git pull origin main', 'git pull --rebase']
  },
  
  // 分支管理
  {
    id: 'git-branch',
    name: 'List Branches',
    description: 'List, create, or delete branches',
    command: 'git branch',
    category: 'branching',
    examples: ['git branch', 'git branch -a', 'git branch -r']
  },
  {
    id: 'git-checkout',
    name: 'Switch Branch',
    description: 'Switch branches or restore working tree files',
    command: 'git checkout {branch}',
    category: 'branching',
    parameters: [
      {
        name: 'branch',
        description: 'Branch name',
        type: 'string',
        required: true,
        placeholder: 'branch-name'
      }
    ],
    examples: ['git checkout main', 'git checkout -b new-feature']
  },
  {
    id: 'git-merge',
    name: 'Merge Branch',
    description: 'Join two or more development histories together',
    command: 'git merge {branch}',
    category: 'branching',
    parameters: [
      {
        name: 'branch',
        description: 'Branch to merge',
        type: 'string',
        required: true,
        placeholder: 'feature-branch'
      }
    ],
    examples: ['git merge feature-branch', 'git merge --no-ff feature-branch']
  },
  
  // 历史查看
  {
    id: 'git-log',
    name: 'View History',
    description: 'Show commit logs',
    command: 'git log',
    category: 'history',
    examples: [
      'git log',
      'git log --oneline',
      'git log --graph --oneline --all'
    ]
  },
  {
    id: 'git-diff',
    name: 'Show Differences',
    description: 'Show changes between commits, commit and working tree, etc',
    command: 'git diff',
    category: 'history',
    examples: ['git diff', 'git diff --staged', 'git diff HEAD~1']
  },
  
  // 高级命令
  {
    id: 'git-rebase',
    name: 'Rebase Branch',
    description: 'Reapply commits on top of another base tip',
    command: 'git rebase {branch}',
    category: 'advanced',
    parameters: [
      {
        name: 'branch',
        description: 'Base branch',
        type: 'string',
        required: true,
        placeholder: 'main'
      }
    ],
    examples: ['git rebase main', 'git rebase -i HEAD~3']
  },
  {
    id: 'git-reset',
    name: 'Reset Changes',
    description: 'Reset current HEAD to the specified state',
    command: 'git reset {mode} {commit}',
    category: 'advanced',
    parameters: [
      {
        name: 'mode',
        description: 'Reset mode',
        type: 'select',
        required: false,
        defaultValue: '--mixed',
        options: ['--soft', '--mixed', '--hard']
      },
      {
        name: 'commit',
        description: 'Commit reference',
        type: 'string',
        required: false,
        defaultValue: 'HEAD',
        placeholder: 'HEAD~1'
      }
    ],
    examples: ['git reset HEAD~1', 'git reset --hard HEAD~1', 'git reset --soft HEAD~1']
  },
  {
    id: 'git-stash',
    name: 'Stash Changes',
    description: 'Stash the changes in a dirty working directory away',
    command: 'git stash',
    category: 'advanced',
    examples: ['git stash', 'git stash pop', 'git stash list']
  }
]

// Git 命令分类
export const GIT_COMMAND_CATEGORIES = {
  basic: {
    name: 'Basic Commands',
    description: 'Essential Git commands for daily use',
    icon: '📝'
  },
  branching: {
    name: 'Branch Management',
    description: 'Commands for creating and managing branches',
    icon: '🌿'
  },
  remote: {
    name: 'Remote Operations',
    description: 'Commands for working with remote repositories',
    icon: '🌐'
  },
  history: {
    name: 'History & Inspection',
    description: 'Commands for viewing history and changes',
    icon: '📊'
  },
  advanced: {
    name: 'Advanced Operations',
    description: 'Advanced Git commands for complex workflows',
    icon: '⚡'
  }
}

// 常用 Git 工作流模板
export const GIT_WORKFLOW_TEMPLATES = [
  {
    name: 'Feature Branch Workflow',
    description: 'Create a new feature branch and merge back to main',
    commands: [
      'git checkout main',
      'git pull origin main',
      'git checkout -b feature/new-feature',
      '# Make your changes',
      'git add .',
      'git commit -m "Add new feature"',
      'git push -u origin feature/new-feature',
      '# Create pull request',
      'git checkout main',
      'git merge feature/new-feature',
      'git branch -d feature/new-feature'
    ]
  },
  {
    name: 'Hotfix Workflow',
    description: 'Quick fix for production issues',
    commands: [
      'git checkout main',
      'git pull origin main',
      'git checkout -b hotfix/critical-fix',
      '# Make your fix',
      'git add .',
      'git commit -m "Fix critical issue"',
      'git push -u origin hotfix/critical-fix',
      'git checkout main',
      'git merge hotfix/critical-fix',
      'git push origin main',
      'git branch -d hotfix/critical-fix'
    ]
  },
  {
    name: 'Release Workflow',
    description: 'Prepare and tag a new release',
    commands: [
      'git checkout main',
      'git pull origin main',
      'git checkout -b release/v1.0.0',
      '# Update version numbers',
      'git add .',
      'git commit -m "Prepare release v1.0.0"',
      'git checkout main',
      'git merge release/v1.0.0',
      'git tag -a v1.0.0 -m "Release version 1.0.0"',
      'git push origin main --tags',
      'git branch -d release/v1.0.0'
    ]
  }
]

// 格式化 Git 命令
export const formatGitCommand = (command: GitCommand, parameters: Record<string, any>): string => {
  let formattedCommand = command.command
  
  // 替换参数占位符
  if (command.parameters) {
    command.parameters.forEach(param => {
      const value = parameters[param.name] || param.defaultValue || ''
      const placeholder = `{${param.name}}`
      
      if (formattedCommand.includes(placeholder)) {
        if (value) {
          formattedCommand = formattedCommand.replace(placeholder, value.toString())
        } else {
          // 如果参数为空且不是必需的，移除整个参数部分
          if (!param.required) {
            formattedCommand = formattedCommand.replace(new RegExp(`\\s*${placeholder}`, 'g'), '')
          }
        }
      }
    })
  }
  
  // 清理多余的空格
  return formattedCommand.replace(/\s+/g, ' ').trim()
}

// 验证 Git 命令参数
export const validateGitParameters = (command: GitCommand, parameters: Record<string, any>): string[] => {
  const errors: string[] = []
  
  if (command.parameters) {
    command.parameters.forEach(param => {
      const value = parameters[param.name]
      
      if (param.required && (!value || value.toString().trim() === '')) {
        errors.push(`Parameter '${param.name}' is required`)
      }
      
      if (value && param.type === 'number' && isNaN(Number(value))) {
        errors.push(`Parameter '${param.name}' must be a number`)
      }
      
      if (value && param.options && !param.options.includes(value.toString())) {
        errors.push(`Parameter '${param.name}' must be one of: ${param.options.join(', ')}`)
      }
    })
  }
  
  return errors
}