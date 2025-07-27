// 所有类型声明均从 text-to-pdf.tsx 迁移
export interface TextFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  pdfResult?: PDFResult
}

export interface PDFResult {
  blob: Blob
  url: string
  filename: string
  size: number
  pageCount: number
  generationTime: number
  settings: PDFSettings
}

export interface PDFSettings {
  pageSize: PageSize
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  font: {
    family: FontFamily
    size: number
    lineHeight: number
  }
  styling: {
    textAlign: TextAlign
    textColor: string
    backgroundColor: string
    enableSyntaxHighlighting: boolean
  }
  header: {
    enabled: boolean
    text: string
    fontSize: number
    alignment: TextAlign
  }
  footer: {
    enabled: boolean
    text: string
    fontSize: number
    alignment: TextAlign
    showPageNumbers: boolean
  }
  tableOfContents: {
    enabled: boolean
    title: string
    maxDepth: number
  }
  metadata: {
    title: string
    author: string
    subject: string
    keywords: string
  }
}

export interface PDFStatistics {
  totalFiles: number
  totalPages: number
  totalSize: number
  averageGenerationTime: number
  successfulConversions: number
  failedConversions: number
}

export interface PDFTemplate {
  id: string
  name: string
  description: string
  settings: Partial<PDFSettings>
  preview: string
}

export type PageSize = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Tabloid'
export type FontFamily = 'Arial' | 'Times' | 'Courier' | 'Helvetica' | 'Georgia' | 'Verdana'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'
