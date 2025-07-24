import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

// 导出格式
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml' | 'html' | 'pdf' | 'xlsx' | 'md'

// 导出配置
export interface ExportConfig {
  filename?: string
  format: ExportFormat
  data: any
  options?: ExportOptions
}

// 导出选项
export interface ExportOptions {
  // JSON 选项
  jsonIndent?: number
  jsonReplacer?: (key: string, value: any) => any
  
  // CSV 选项
  csvDelimiter?: string
  csvHeaders?: string[]
  csvIncludeHeaders?: boolean
  
  // 文本选项
  textEncoding?: string
  textLineEnding?: '\n' | '\r\n'
  
  // HTML 选项
  htmlTitle?: string
  htmlStyle?: string
  htmlTemplate?: string
  
  // 通用选项
  compression?: boolean
  timestamp?: boolean
  metadata?: Record<string, any>
}

// 导出历史项
export interface ExportHistoryItem {
  id: string
  filename: string
  format: ExportFormat
  size: number
  timestamp: number
  success: boolean
  error?: string
}

// 导出统计
export interface ExportStats {
  totalExports: number
  successfulExports: number
  failedExports: number
  totalSize: number
  formatCounts: Record<ExportFormat, number>
  lastExport?: ExportHistoryItem
}

// 导出管理器 Hook
export function useExportManager() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([])
  const [exportStats, setExportStats] = useState<ExportStats>({
    totalExports: 0,
    successfulExports: 0,
    failedExports: 0,
    totalSize: 0,
    formatCounts: {} as Record<ExportFormat, number>
  })
  
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null)

  // 生成文件名
  const generateFilename = useCallback((baseName: string, format: ExportFormat, includeTimestamp = true) => {
    const timestamp = includeTimestamp ? `_${new Date().toISOString().replace(/[:.]/g, '-')}` : ''
    return `${baseName}${timestamp}.${format}`
  }, [])

  // 转换数据为指定格式
  const convertData = useCallback((data: any, format: ExportFormat, options: ExportOptions = {}) => {
    switch (format) {
      case 'json':
        return JSON.stringify(data, options.jsonReplacer, options.jsonIndent || 2)
      
      case 'csv':
        return convertToCSV(data, options)
      
      case 'txt':
        return convertToText(data, options)
      
      case 'xml':
        return convertToXML(data, options)
      
      case 'yaml':
        return convertToYAML(data, options)
      
      case 'html':
        return convertToHTML(data, options)
      
      case 'md':
        return convertToMarkdown(data, options)
      
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }, [])

  // CSV 转换
  const convertToCSV = useCallback((data: any, options: ExportOptions) => {
    const delimiter = options.csvDelimiter || ','
    const includeHeaders = options.csvIncludeHeaders !== false
    
    if (Array.isArray(data)) {
      if (data.length === 0) return ''
      
      const headers = options.csvHeaders || Object.keys(data[0])
      const rows = data.map(item => 
        headers.map(header => {
          const value = item[header] || ''
          // 转义包含分隔符、引号或换行符的值
          if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(delimiter)
      )
      
      if (includeHeaders) {
        return [headers.join(delimiter), ...rows].join('\n')
      }
      return rows.join('\n')
    }
    
    // 单个对象转换为两行 CSV（键和值）
    const keys = Object.keys(data)
    const values = keys.map(key => data[key])
    return [keys.join(delimiter), values.join(delimiter)].join('\n')
  }, [])

  // 文本转换
  const convertToText = useCallback((data: any, options: ExportOptions) => {
    const lineEnding = options.textLineEnding || '\n'
    
    if (typeof data === 'string') {
      return data.replace(/\n/g, lineEnding)
    }
    
    if (Array.isArray(data)) {
      return data.map(item => 
        typeof item === 'object' ? JSON.stringify(item) : String(item)
      ).join(lineEnding)
    }
    
    if (typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(lineEnding)
    }
    
    return String(data)
  }, [])

  // XML 转换
  const convertToXML = useCallback((data: any, options: ExportOptions) => {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    
    const objectToXML = (obj: any, rootName = 'root'): string => {
      if (typeof obj !== 'object' || obj === null) {
        return `<${rootName}>${String(obj)}</${rootName}>`
      }
      
      if (Array.isArray(obj)) {
        return `<${rootName}>${obj.map((item, index) => 
          objectToXML(item, `item_${index}`)
        ).join('')}</${rootName}>`
      }
      
      const xmlContent = Object.entries(obj)
        .map(([key, value]) => objectToXML(value, key))
        .join('')
      
      return `<${rootName}>${xmlContent}</${rootName}>`
    }
    
    return xmlHeader + '\n' + objectToXML(data)
  }, [])

  // YAML 转换（简化版）
  const convertToYAML = useCallback((data: any, options: ExportOptions) => {
    const yamlStringify = (obj: any, indent = 0): string => {
      const spaces = ' '.repeat(indent)
      
      if (obj === null || obj === undefined) {
        return 'null'
      }
      
      if (typeof obj === 'string') {
        return obj.includes('\n') ? `|\n${obj.split('\n').map(line => spaces + '  ' + line).join('\n')}` : obj
      }
      
      if (typeof obj === 'number' || typeof obj === 'boolean') {
        return String(obj)
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => `\n${spaces}- ${yamlStringify(item, indent + 2)}`).join('')
      }
      
      if (typeof obj === 'object') {
        return Object.entries(obj)
          .map(([key, value]) => `\n${spaces}${key}: ${yamlStringify(value, indent + 2)}`)
          .join('')
      }
      
      return String(obj)
    }
    
    return yamlStringify(data).trim()
  }, [])

  // HTML 转换
  const convertToHTML = useCallback((data: any, options: ExportOptions) => {
    const title = options.htmlTitle || 'Exported Data'
    const style = options.htmlStyle || `
      body { font-family: Arial, sans-serif; margin: 20px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; }
    `
    
    if (options.htmlTemplate) {
      return options.htmlTemplate
        .replace('{{title}}', title)
        .replace('{{data}}', JSON.stringify(data, null, 2))
        .replace('{{style}}', style)
    }
    
    let content = ''
    
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      // 表格格式
      const headers = Object.keys(data[0])
      content = `
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => 
              `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      `
    } else {
      // 预格式化文本
      content = `<pre>${JSON.stringify(data, null, 2)}</pre>`
    }
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>${style}</style>
      </head>
      <body>
        <h1>${title}</h1>
        ${content}
      </body>
      </html>
    `
  }, [])

  // Markdown 转换
  const convertToMarkdown = useCallback((data: any, options: ExportOptions) => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      // 表格格式
      const headers = Object.keys(data[0])
      const headerRow = `| ${headers.join(' | ')} |`
      const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`
      const dataRows = data.map(row => 
        `| ${headers.map(h => row[h] || '').join(' | ')} |`
      )
      
      return [headerRow, separatorRow, ...dataRows].join('\n')
    }
    
    if (typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => `**${key}**: ${value}`)
        .join('\n\n')
    }
    
    return String(data)
  }, [])

  // 创建下载链接
  const createDownloadLink = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    // 直接创建临时下载链接，不使用 ref
    const downloadLink = document.createElement('a')
    downloadLink.style.display = 'none'
    downloadLink.href = url
    downloadLink.download = filename
    
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    
    // 清理 URL
    setTimeout(() => URL.revokeObjectURL(url), 100)
    
    return { url, size: blob.size }
  }, [])

  // 获取 MIME 类型
  const getMimeType = useCallback((format: ExportFormat) => {
    const mimeTypes: Record<ExportFormat, string> = {
      json: 'application/json',
      csv: 'text/csv',
      txt: 'text/plain',
      xml: 'application/xml',
      yaml: 'text/yaml',
      html: 'text/html',
      md: 'text/markdown',
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    return mimeTypes[format] || 'application/octet-stream'
  }, [])

  // 添加到历史
  const addToHistory = useCallback((item: Omit<ExportHistoryItem, 'id'>) => {
    const historyItem: ExportHistoryItem = {
      ...item,
      id: Date.now().toString()
    }
    
    setExportHistory(prev => [historyItem, ...prev.slice(0, 49)]) // 保留最近 50 条
    
    // 更新统计
    setExportStats(prev => ({
      totalExports: prev.totalExports + 1,
      successfulExports: prev.successfulExports + (item.success ? 1 : 0),
      failedExports: prev.failedExports + (item.success ? 0 : 1),
      totalSize: prev.totalSize + item.size,
      formatCounts: {
        ...prev.formatCounts,
        [item.format]: (prev.formatCounts[item.format] || 0) + 1
      },
      lastExport: historyItem
    }))
  }, [])

  // 导出数据
  const exportData = useCallback(async (config: ExportConfig) => {
    const { filename: baseFilename, format, data, options = {} } = config
    
    setIsExporting(true)
    setExportProgress(0)
    
    try {
      // 生成文件名
      const filename = baseFilename || generateFilename('export', format, options.timestamp)
      
      setExportProgress(25)
      
      // 转换数据
      const content = convertData(data, format, options)
      
      setExportProgress(50)
      
      // 获取 MIME 类型
      const mimeType = getMimeType(format)
      
      setExportProgress(75)
      
      // 创建下载
      const { size } = createDownloadLink(content, filename, mimeType)
      
      setExportProgress(100)
      
      // 添加到历史
      addToHistory({
        filename,
        format,
        size,
        timestamp: Date.now(),
        success: true
      })
      
      toast.success(`Successfully exported ${filename}`)
      return { success: true, filename, size }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // 添加失败记录到历史
      addToHistory({
        filename: baseFilename || 'export',
        format,
        size: 0,
        timestamp: Date.now(),
        success: false,
        error: errorMessage
      })
      
      toast.error(`Export failed: ${errorMessage}`)
      return { success: false, error: errorMessage }
      
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }, [generateFilename, convertData, getMimeType, createDownloadLink, addToHistory])

  // 批量导出
  const exportBatch = useCallback(async (configs: ExportConfig[]) => {
    const results = []
    
    for (let i = 0; i < configs.length; i++) {
      const result = await exportData(configs[i])
      results.push(result)
      
      // 短暂延迟避免浏览器阻塞
      if (i < configs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }, [exportData])

  // 清除历史
  const clearHistory = useCallback(() => {
    setExportHistory([])
    setExportStats({
      totalExports: 0,
      successfulExports: 0,
      failedExports: 0,
      totalSize: 0,
      formatCounts: {} as Record<ExportFormat, number>
    })
    toast.success('Export history cleared')
  }, [])

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  return {
    // 状态
    isExporting,
    exportProgress,
    exportHistory,
    exportStats,
    
    // 操作
    exportData,
    exportBatch,
    clearHistory,
    
    // 工具函数
    generateFilename,
    convertData,
    formatFileSize,
    getMimeType,
    
    // 支持的格式
    supportedFormats: ['json', 'csv', 'txt', 'xml', 'yaml', 'html', 'md'] as ExportFormat[]
  }
}

// 专用的 JSON 导出 Hook
export function useJSONExport() {
  const exportManager = useExportManager()
  
  const exportJSON = useCallback((data: any, filename?: string, options?: {
    indent?: number
    replacer?: (key: string, value: any) => any
  }) => {
    return exportManager.exportData({
      filename: filename || 'data.json',
      format: 'json',
      data,
      options: {
        jsonIndent: options?.indent,
        jsonReplacer: options?.replacer
      }
    })
  }, [exportManager])
  
  return {
    ...exportManager,
    exportJSON
  }
}

// 专用的 CSV 导出 Hook
export function useCSVExport() {
  const exportManager = useExportManager()
  
  const exportCSV = useCallback((data: any[], filename?: string, options?: {
    delimiter?: string
    headers?: string[]
    includeHeaders?: boolean
  }) => {
    return exportManager.exportData({
      filename: filename || 'data.csv',
      format: 'csv',
      data,
      options: {
        csvDelimiter: options?.delimiter,
        csvHeaders: options?.headers,
        csvIncludeHeaders: options?.includeHeaders
      }
    })
  }, [exportManager])
  
  return {
    ...exportManager,
    exportCSV
  }
}