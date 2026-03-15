import React, { useCallback, useMemo, useRef, useState } from "react"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import type { DiffFile, DiffPair, DiffResult, DiffSettings } from "./schema"
import { generateDiff, validateTextFile } from "./logic"

/**
 * 文本 diff 处理相关 hooks。
 */
export const useDiffProcessing = () => {
  const processDiff = useCallback((textA: string, textB: string, settings: DiffSettings): DiffResult => {
    try {
      return generateDiff(textA, textB, settings)
    } catch (error) {
      console.error("Diff processing error:", error)
      throw new Error("Failed to process diff")
    }
  }, [])

  const processFilePair = useCallback(
    async (leftFile: DiffFile, rightFile: DiffFile, settings: DiffSettings): Promise<DiffPair> => {
      try {
        const result = processDiff(leftFile.content, rightFile.content, settings)

        return {
          id: nanoid(),
          leftFile: { ...leftFile, status: "completed" },
          rightFile: { ...rightFile, status: "completed" },
          status: "completed",
          result,
          processedAt: new Date(),
        }
      } catch (error) {
        return {
          id: nanoid(),
          leftFile: { ...leftFile, status: "error" },
          rightFile: { ...rightFile, status: "error" },
          status: "error",
          error: error instanceof Error ? error.message : "Processing failed",
        }
      }
    },
    [processDiff],
  )

  const processBatch = useCallback(
    async (pairs: DiffPair[], settings: DiffSettings): Promise<DiffPair[]> => {
      return Promise.all(pairs.map((pair) => processFilePair(pair.leftFile, pair.rightFile, settings)))
    },
    [processFilePair],
  )

  return { processDiff, processFilePair, processBatch }
}

/**
 * 实时 diff 计算 hook。
 */
export const useRealTimeDiff = (textA: string, textB: string, settings: DiffSettings): DiffResult => {
  return useMemo(() => {
    if (!textA.trim() && !textB.trim()) {
      return {
        lines: [],
        statistics: {
          totalLines: 0,
          addedLines: 0,
          removedLines: 0,
          modifiedLines: 0,
          unchangedLines: 0,
          addedWords: 0,
          removedWords: 0,
          similarity: 100,
          executionTime: 0,
        },
        algorithm: settings.algorithm,
        format: settings.format,
      }
    }

    try {
      return generateDiff(textA, textB, settings)
    } catch (error) {
      console.error("Real-time diff error:", error)
      return {
        lines: [],
        statistics: {
          totalLines: 0,
          addedLines: 0,
          removedLines: 0,
          modifiedLines: 0,
          unchangedLines: 0,
          addedWords: 0,
          removedWords: 0,
          similarity: 0,
          executionTime: 0,
        },
        algorithm: settings.algorithm,
        format: settings.format,
      }
    }
  }, [textA, textB, settings])
}

/**
 * 文件读取与批量处理 hook。
 */
export const useFileProcessing = () => {
  const processFile = useCallback(async (file: File): Promise<DiffFile> => {
    const validation = validateTextFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string

          const diffFile: DiffFile = {
            id: nanoid(),
            name: file.name,
            content,
            size: file.size,
            type: file.type || "text/plain",
            status: "pending",
          }

          resolve(diffFile)
        } catch (error) {
          reject(new Error("Failed to process file"))
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }, [])

  const processBatch = useCallback(
    async (files: File[]): Promise<DiffFile[]> => {
      const results = await Promise.allSettled(files.map((file) => processFile(file)))

      return results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value
        }
        return {
          id: nanoid(),
          name: files[index].name,
          content: "",
          size: files[index].size,
          type: files[index].type || "text/plain",
          status: "error" as const,
          error: (result as PromiseRejectedResult).reason?.message || "Processing failed",
        }
      })
    },
    [processFile],
  )

  return { processFile, processBatch }
}

/**
 * 导出相关 hook。
 */
export const useDiffExport = () => {
  const exportUnifiedDiff = useCallback(
    (result: DiffResult, leftName: string = "left", rightName: string = "right", filename?: string) => {
      const lines = [
        `--- ${leftName}`,
        `+++ ${rightName}`,
        `@@ -1,${result.statistics.totalLines} +1,${result.statistics.totalLines} @@`,
      ]

      result.lines.forEach((line) => {
        switch (line.type) {
          case "added":
            lines.push(`+${line.content}`)
            break
          case "removed":
            lines.push(`-${line.content}`)
            break
          case "unchanged":
            lines.push(` ${line.content}`)
            break
          case "modified":
            lines.push(`-${line.leftContent || ""}`)
            lines.push(`+${line.rightContent || ""}`)
            break
        }
      })

      const content = lines.join("\n")
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename || "diff.patch"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [],
  )

  const exportHTML = useCallback(
    (result: DiffResult, leftName: string = "left", rightName: string = "right", filename?: string) => {
      const css = `
      <style>
        body { font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; margin: 20px; }
        .diff-header { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; margin-bottom: 10px; }
        .diff-line { padding: 2px 5px; white-space: pre-wrap; }
        .added { background-color: #d4edda; color: #155724; }
        .removed { background-color: #f8d7da; color: #721c24; }
        .modified { background-color: #fff3cd; color: #856404; }
        .unchanged { background-color: #f8f9fa; }
        .line-number { display: inline-block; width: 50px; text-align: right; margin-right: 10px; color: #666; }
      </style>
    `

      const header = `
      <div class="diff-header">
        <h2>Diff: ${leftName} vs ${rightName}</h2>
        <p>Statistics: ${result.statistics.addedLines} added, ${result.statistics.removedLines} removed, ${result.statistics.modifiedLines} modified</p>
        <p>Similarity: ${result.statistics.similarity.toFixed(1)}%</p>
      </div>
    `

      const diffLines = result.lines
        .map((line, index) => {
          const lineClass = line.type
          const lineNumber = `<span class="line-number">${index + 1}</span>`
          return `<div class="diff-line ${lineClass}">${lineNumber}${line.content}</div>`
        })
        .join("")

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Diff Report</title>${css}</head><body>${header}${diffLines}</body></html>`

      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename || "diff-report.html"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [],
  )

  const exportBatch = useCallback((pairs: DiffPair[]) => {
    const content = pairs
      .map(
        (pair, index) =>
          `=== Diff ${index + 1}: ${pair.leftFile.name} vs ${pair.rightFile.name} ===\n` +
          `Status: ${pair.status}\n` +
          `Statistics: ${pair.result ? JSON.stringify(pair.result.statistics, null, 2) : "N/A"}\n` +
          `${pair.error ? `Error: ${pair.error}` : ""}\n` +
          "---\n",
      )
      .join("\n")

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "diff-batch-results.txt"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportCSV = useCallback((pairs: DiffPair[]) => {
    const headers = [
      "Left File",
      "Right File",
      "Status",
      "Added Lines",
      "Removed Lines",
      "Modified Lines",
      "Similarity %",
      "Execution Time (ms)",
    ]

    const rows = pairs.map((pair) => [
      pair.leftFile.name,
      pair.rightFile.name,
      pair.status,
      pair.result?.statistics.addedLines || 0,
      pair.result?.statistics.removedLines || 0,
      pair.result?.statistics.modifiedLines || 0,
      pair.result ? pair.result.statistics.similarity.toFixed(2) : 0,
      pair.result ? pair.result.statistics.executionTime.toFixed(2) : 0,
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "diff-statistics.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportUnifiedDiff, exportHTML, exportBatch, exportCSV }
}

/**
 * 文本复制 hook。
 */
export const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || "text")
      toast.success(`${label || "Text"} copied to clipboard`)

      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  return { copyToClipboard, copiedText }
}

/**
 * 拖拽上传 hook。
 */
export const useDragAndDrop = (onFilesDropped: (files: File[]) => void) => {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.match(/\.(txt|text|log|csv|json|md|markdown|js|ts|jsx|tsx|py|java|cpp|c|h|css|html|xml|yaml|yml)$/i),
      )

      if (files.length > 0) {
        onFilesDropped(files)
      } else {
        toast.error("Please drop only text files")
      }
    },
    [onFilesDropped],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onFilesDropped(files)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [onFilesDropped],
  )

  return {
    dragActive,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileInput,
  }
}
