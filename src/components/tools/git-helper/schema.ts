import { z } from "zod"

// ==================== Git Helper Schemas ====================

/**
 * Git Command Category schema
 */
export const gitCommandCategorySchema = z.enum(["basic", "branching", "remote", "history", "advanced"])

/**
 * Git Parameter Type schema
 */
export const gitParameterTypeSchema = z.enum(["string", "boolean", "number", "select"])

/**
 * Repository Status schema
 */
export const repositoryStatusSchema = z.enum(["clean", "modified", "staged", "conflict"])

/**
 * Remote Type schema
 */
export const remoteTypeSchema = z.enum(["fetch", "push"])

/**
 * File Status schema
 */
export const fileStatusSchema = z.enum(["added", "modified", "deleted", "renamed", "copied", "untracked", "conflicted"])

/**
 * Git Parameter schema
 */
export const gitParameterSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: gitParameterTypeSchema,
  required: z.boolean(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
})

/**
 * Git Command schema
 */
export const gitCommandSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  command: z.string(),
  category: gitCommandCategorySchema,
  parameters: z.array(gitParameterSchema).optional(),
  examples: z.array(z.string()).optional(),
  documentation: z.string().optional(),
})

/**
 * Git Remote schema
 */
export const gitRemoteSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: remoteTypeSchema,
})

/**
 * Git Commit schema
 */
export const gitCommitSchema = z.object({
  hash: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.string(),
  files: z.array(z.string()),
})

/**
 * Git Branch schema
 */
export const gitBranchSchema = z.object({
  name: z.string(),
  current: z.boolean(),
  remote: z.string().optional(),
  lastCommit: gitCommitSchema.optional(),
})

/**
 * Git File schema
 */
export const gitFileSchema = z.object({
  path: z.string(),
  status: fileStatusSchema,
  oldPath: z.string().optional(),
})

/**
 * Git Status schema
 */
export const gitStatusSchema = z.object({
  branch: z.string(),
  ahead: z.number(),
  behind: z.number(),
  staged: z.array(gitFileSchema),
  modified: z.array(gitFileSchema),
  untracked: z.array(gitFileSchema),
  conflicted: z.array(gitFileSchema),
})

/**
 * Git Repository schema
 */
export const gitRepositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  branch: z.string(),
  status: repositoryStatusSchema,
  remotes: z.array(gitRemoteSchema),
  lastCommit: gitCommitSchema.optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * Git Command Execution schema
 */
export const gitCommandExecutionSchema = z.object({
  id: z.string(),
  command: z.string(),
  parameters: z.record(z.string(), z.any()),
  output: z.string(),
  exitCode: z.number(),
  timestamp: z.number(),
  duration: z.number(),
  repository: z.string().optional(),
})

/**
 * Git Helper State schema
 */
export const gitHelperStateSchema = z.object({
  repositories: z.array(gitRepositorySchema),
  activeRepository: gitRepositorySchema.optional(),
  commands: z.array(gitCommandSchema),
  commandHistory: z.array(gitCommandExecutionSchema),
  favorites: z.array(z.string()),
  isExecuting: z.boolean(),
  error: z.string().optional(),
})

// ==================== Type Exports ====================

export type GitCommandCategory = z.infer<typeof gitCommandCategorySchema>
export type GitParameterType = z.infer<typeof gitParameterTypeSchema>
export type RepositoryStatus = z.infer<typeof repositoryStatusSchema>
export type RemoteType = z.infer<typeof remoteTypeSchema>
export type FileStatus = z.infer<typeof fileStatusSchema>
export type GitParameter = z.infer<typeof gitParameterSchema>
export type GitCommand = z.infer<typeof gitCommandSchema>
export type GitRemote = z.infer<typeof gitRemoteSchema>
export type GitCommit = z.infer<typeof gitCommitSchema>
export type GitBranch = z.infer<typeof gitBranchSchema>
export type GitFile = z.infer<typeof gitFileSchema>
export type GitStatus = z.infer<typeof gitStatusSchema>
export type GitRepository = z.infer<typeof gitRepositorySchema>
export type GitCommandExecution = z.infer<typeof gitCommandExecutionSchema>
export type GitHelperState = z.infer<typeof gitHelperStateSchema>

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
