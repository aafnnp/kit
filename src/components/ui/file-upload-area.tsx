// src/components/ui/file-upload-area.tsx
import { Button } from '@/components/ui/button'
import { Upload, FileImage } from 'lucide-react'
import { useDragAndDrop } from '@/hooks/use-drag-drop'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/utils'

interface FileUploadAreaProps {
  onFilesSelected: (files: File[]) => void
  isProcessing?: boolean
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  fileTypes?: string[]
  title?: string
  description?: string
  buttonText?: string
  supportedFormatsText?: string
}

export function FileUploadArea({
  onFilesSelected,
  isProcessing = false,
  accept = '*/*',
  multiple = true,
  maxSize,
  fileTypes,
  title = 'Upload Files',
  description = 'Drag and drop your files here, or click to select files',
  buttonText = 'Choose Files',
  supportedFormatsText,
}: FileUploadAreaProps) {
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    (files: File[]) => {
      if (maxSize) {
        const validFiles = files.filter((file) => file.size <= maxSize)
        if (validFiles.length < files.length) {
          toast.error(
            `${files.length - validFiles.length} file(s) exceeded the size limit of ${formatFileSize(maxSize)}`
          )
        }
        onFilesSelected(validFiles)
      } else {
        onFilesSelected(files)
      }
    },
    { accept: fileTypes }
  )

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label={description}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          fileInputRef.current?.click()
        }
      }}
    >
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2" disabled={isProcessing}>
        <FileImage className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
      {supportedFormatsText && <p className="text-xs text-muted-foreground">{supportedFormatsText}</p>}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        aria-label="Select files"
      />
    </div>
  )
}
