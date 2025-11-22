import { Button } from "@/components/ui/button"
import { Upload, FileImage } from "lucide-react"
import { useDragAndDrop } from "@/hooks/use-drag-drop"
import { formatFileSize } from "@/lib/utils"
import { type FileUploadAreaProps } from "@/components/common/schemas"

// Re-export type for backward compatibility
export type { FileUploadAreaProps }

export function FileUploadArea({
  onFilesSelected,
  isProcessing = false,
  accept = "*/*",
  multiple = true,
  title = "Upload Files",
  description = "Drag and drop your files here, or click to select files",
  buttonText = "Choose Files",
  supportedFormatsText,
  config = {},
  icon,
}: FileUploadAreaProps) {
  const dragDropConfig = {
    accept,
    multiple,
    ...config,
  }

  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    onFilesSelected,
    dragDropConfig
  )

  const getAcceptText = () => {
    if (supportedFormatsText) return supportedFormatsText

    if (accept === "*/*") return "All file types supported"
    if (accept.includes("image/")) return "Image files supported"
    if (accept.includes("audio/")) return "Audio files supported"
    if (accept.includes("video/")) return "Video files supported"
    if (accept.includes("text/")) return "Text files supported"

    return `Supported formats: ${accept}`
  }

  const getMaxSizeText = () => {
    if (config.maxSize) {
      return ` • Max ${formatFileSize(config.maxSize)} per file`
    }
    return ""
  }

  const getMaxFilesText = () => {
    if (!multiple) return " • Single file only"
    if (config.maxFiles) {
      return ` • Max ${config.maxFiles} files`
    }
    return ""
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
      } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          fileInputRef.current?.click()
        }
      }}
    >
      {icon || <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="mb-2"
        disabled={isProcessing}
      >
        <FileImage className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
      <p className="text-xs text-muted-foreground">
        {getAcceptText()}
        {getMaxSizeText()}
        {getMaxFilesText()}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  )
}
