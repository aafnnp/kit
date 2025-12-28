// ==================== Git Helper Types ====================

/**
 * Git Command Category type
 */
export type gitCommandCategory = "basic" | "branching" | "remote" | "history" | "advanced"

/**
 * Git Parameter Type type
 */
export type gitParameterType = "string" | "boolean" | "number" | "select"

/**
 * Repository Status type
 */
export type repositoryStatus = "clean" | "modified" | "staged" | "conflict"

/**
 * Remote Type type
 */
export type remoteType = "fetch" | "push"

/**
 * File Status type
 */
export type fileStatus = "added" | "modified" | "deleted" | "renamed" | "copied" | "untracked" | "conflicted"

/**
 * Git Parameter type
 */
export interface gitParameter {
  name: string,
  description: string,
  type: gitParameterType,
  required: boolean
  defaultValue?: string | number | boolean,
  options?: string[],
  placeholder?: string,
}

/**
 * Git Command type
 */
export interface gitCommand {
  id: string,
  name: string,
  description: string,
  command: string,
  category: gitCommandCategory
  parameters?: gitParameter[],
  examples?: string[],
  documentation?: string,
}

/**
 * Git Remote type
 */
export interface gitRemote {
  name: string,
  url: string,
  type: remoteType,
}

/**
 * Git Commit type
 */
export interface gitCommit {
  hash: string,
  message: string,
  author: string,
  date: string,
  files: string[],
}

/**
 * Git Branch type
 */
export interface gitBranch {
  name: string,
  current: boolean
  remote?: string,
  lastCommit?: gitCommit,
}

/**
 * Git File type
 */
export interface gitFile {
  path: string,
  status: fileStatus
  oldPath?: string,
}

/**
 * Git Status type
 */
export interface gitStatus {
  branch: string,
  ahead: number,
  behind: number,
  staged: gitFile[],
  modified: gitFile[],
  untracked: gitFile[],
  conflicted: gitFile[],
}

/**
 * Git Repository type
 */
export interface gitRepository {
  id: string,
  name: string,
  path: string,
  branch: string,
  status: repositoryStatus,
  remotes: gitRemote[]
  lastCommit?: gitCommit,
  createdAt: number,
  updatedAt: number,
}

/**
 * Git Command Execution type
 */
export interface gitCommandExecution {
  id: string,
  command: string,
  parameters: Record<string, any>,
  output: string,
  exitCode: number,
  timestamp: number,
  duration: number
  repository?: string,
}

/**
 * Git Helper State type
 */
export interface gitHelperState {
  repositories: gitRepository[]
  activeRepository?: gitRepository,
  commands: gitCommand[],
  commandHistory: gitCommandExecution[],
  favorites: string[],
  isExecuting: boolean
  error?: string,
}

// ==================== Type Exports ====================

export type GitCommandCategory = gitCommandCategory
export type GitParameterType = gitParameterType
export type RepositoryStatus = repositoryStatus
export type RemoteType = remoteType
export type FileStatus = fileStatus
export type GitParameter = gitParameter
export type GitCommand = gitCommand
export type GitRemote = gitRemote
export type GitCommit = gitCommit
export type GitBranch = gitBranch
export type GitFile = gitFile
export type GitStatus = gitStatus
export type GitRepository = gitRepository
export type GitCommandExecution = gitCommandExecution
export type GitHelperState = gitHelperState

// ==================== Constants and Utility Functions ====================

/**
 * Git command templates
 */
export const GIT_COMMAND_TEMPLATES: GitCommand[] = [
  {
    id: "init",
    name: "Initialize Repository",
    description: "Initialize a new git repository",
    command: "git init",
    category: "basic",
    parameters: [],
    examples: [],
  },
  {
    id: "status",
    name: "Check Status",
    description: "Show the working tree status",
    command: "git status",
    category: "basic",
    parameters: [],
    examples: [],
  },
  {
    id: "add",
    name: "Stage Files",
    description: "Add file contents to the index",
    command: "git add",
    category: "basic",
    parameters: [],
    examples: [],
  },
  {
    id: "commit",
    name: "Commit Changes",
    description: "Record changes to the repository",
    command: "git commit",
    category: "basic",
    parameters: [],
    examples: [],
  },
]

/**
 * Git command categories
 */
export const GIT_COMMAND_CATEGORIES: Record<GitCommandCategory, { name: string; icon: string; description: string }> = {
  basic: {
    name: "Basic Commands",
    icon: "GitCommit",
    description: "Essential git commands",
  },
  branching: {
    name: "Branching",
    icon: "GitBranch",
    description: "Branch management commands",
  },
  remote: {
    name: "Remote",
    icon: "GitMerge",
    description: "Remote repository commands",
  },
  history: {
    name: "History",
    icon: "History",
    description: "Commit history commands",
  },
  advanced: {
    name: "Advanced",
    icon: "Settings",
    description: "Advanced git commands",
  },
}

/**
 * Git workflow templates
 */
export const GIT_WORKFLOW_TEMPLATES: Array<{ name: string; description: string; commands: string[] }> = [
  {
    name: "Basic Workflow",
    description: "Standard workflow for committing changes",
    commands: ["git status", "git add .", "git commit -m 'message'", "git push"],
  },
  {
    name: "Feature Branch",
    description: "Create and merge a feature branch",
    commands: [
      "git checkout -b feature/name",
      "git add .",
      "git commit -m 'message'",
      "git push -u origin feature/name",
      "git checkout main",
      "git merge feature/name",
    ],
  },
]

/**
 * Format git command with parameters
 */
export function formatGitCommand(command: string, parameters: Record<string, any>): string {
  let formatted = command
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "boolean") {
        if (value) {
          formatted += ` --${key}`
        }
      } else {
        formatted += ` --${key} ${value}`
      }
    }
  })
  return formatted
}

/**
 * Validate git parameters
 */
export function validateGitParameters(
  parameters: GitParameter[],
  values: Record<string, any>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  parameters.forEach((param) => {
    if (
      param.required &&
      (values[param.name] === undefined || values[param.name] === null || values[param.name] === "")
    ) {
      errors.push(`${param.name} is required`)
    }
  })
  return { isValid: errors.length === 0, errors }
}
