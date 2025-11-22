// Re-export common components
export * from "./enhanced-tool-base"
export * from "./file-upload-area"
export * from "./tool-skeleton"
export * from "./tool-base"
export { default as ToolNotFound } from "./tool-not-found"

// Export tool-error-boundary with explicit exports to avoid conflicts
export { ToolErrorBoundary } from "./tool-error-boundary"
export type { ToolErrorBoundaryProps, ToolErrorBoundaryState } from "./tool-error-boundary"

// Re-export schemas and types (excluding conflicting ToolErrorBoundaryState)
export {
  toolTabSchema,
  toolActionSchema,
  templatePanelPropsSchema,
  settingsPanelPropsSchema,
  historyPanelPropsSchema,
  tabSchema,
  toolBasePropsSchema,
  fileUploadAreaPropsSchema,
  toolErrorBoundaryPropsSchema,
  toolErrorBoundaryStateSchema,
  toolNotFoundPropsSchema,
  type ToolTab,
  type ToolAction,
  type TemplatePanelPropsType,
  type SettingsPanelPropsType,
  type HistoryPanelProps,
  type Tab,
  type ToolBaseProps,
  type FileUploadAreaProps,
  type ToolNotFoundProps,
} from "./schemas"
