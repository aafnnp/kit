import type { DiffLine, WordDiff, DiffResult, DiffStatistics, DiffSettings } from "./schema"

/**
 * 文本文件校验逻辑，限制大小与扩展名。
 */
export const validateTextFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024
  const allowedTypes = [
    ".txt",
    ".text",
    ".log",
    ".csv",
    ".json",
    ".md",
    ".markdown",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".css",
    ".html",
    ".xml",
    ".yaml",
    ".yml",
  ]

  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 50MB" }
  }

  const extension = "." + (file.name.split(".").pop() || "").toLowerCase()
  if (!allowedTypes.includes(extension)) {
    return { isValid: false, error: "Only text files are supported" }
  }

  return { isValid: true }
}

/**
 * Myers 行级 diff 算法实现。
 */
const myersDiff = (textA: string, textB: string): DiffLine[] => {
  const linesA = textA.split(/\r?\n/)
  const linesB = textB.split(/\r?\n/)

  const n = linesA.length
  const m = linesB.length
  const max = n + m

  const v: number[] = new Array(2 * max + 1).fill(0)
  const trace: number[][] = []

  for (let d = 0; d <= max; d++) {
    trace.push([...v])

    for (let k = -d; k <= d; k += 2) {
      let x: number

      if (k === -d || (k !== d && v[k - 1 + max] < v[k + 1 + max])) {
        x = v[k + 1 + max]
      } else {
        x = v[k - 1 + max] + 1
      }

      let y = x - k

      while (x < n && y < m && linesA[x] === linesB[y]) {
        x++
        y++
      }

      v[k + max] = x

      if (x >= n && y >= m) {
        return buildDiffFromTrace(linesA, linesB, trace, d)
      }
    }
  }

  return buildDiffFromTrace(linesA, linesB, trace, max)
}

const buildDiffFromTrace = (linesA: string[], linesB: string[], trace: number[][], d: number): DiffLine[] => {
  const result: DiffLine[] = []
  let x = linesA.length
  let y = linesB.length

  for (let depth = d; depth > 0; depth--) {
    const v = trace[depth]
    const k = x - y
    const max = depth + linesA.length + linesB.length

    let prevK: number
    if (k === -depth || (k !== depth && v[k - 1 + max] < v[k + 1 + max])) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }

    const prevX = v[prevK + max]
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      result.unshift({
        type: "unchanged",
        leftLineNumber: x,
        rightLineNumber: y,
        leftContent: linesA[x - 1],
        rightContent: linesB[y - 1],
        content: linesA[x - 1],
      })
      x--
      y--
    }

    if (depth > 0) {
      if (x > prevX) {
        result.unshift({
          type: "removed",
          leftLineNumber: x,
          leftContent: linesA[x - 1],
          content: linesA[x - 1],
        })
        x--
      } else if (y > prevY) {
        result.unshift({
          type: "added",
          rightLineNumber: y,
          rightContent: linesB[y - 1],
          content: linesB[y - 1],
        })
        y--
      }
    }
  }

  return result
}

/**
 * 词级 diff，用于已经判定为 modified 的行。
 */
const getWordDiff = (leftText: string, rightText: string): WordDiff[] => {
  const leftWords = leftText.split(/(\s+)/)
  const rightWords = rightText.split(/(\s+)/)

  const result: WordDiff[] = []
  let leftIndex = 0
  let rightIndex = 0

  while (leftIndex < leftWords.length || rightIndex < rightWords.length) {
    if (leftIndex >= leftWords.length) {
      result.push({
        type: "added",
        content: rightWords.slice(rightIndex).join(""),
      })
      break
    }

    if (rightIndex >= rightWords.length) {
      result.push({
        type: "removed",
        content: leftWords.slice(leftIndex).join(""),
      })
      break
    }

    if (leftWords[leftIndex] === rightWords[rightIndex]) {
      result.push({
        type: "unchanged",
        content: leftWords[leftIndex],
      })
      leftIndex++
      rightIndex++
      continue
    }

    let foundMatch = false

    for (let i = rightIndex + 1; i < rightWords.length; i++) {
      if (leftWords[leftIndex] === rightWords[i]) {
        for (let j = rightIndex; j < i; j++) {
          result.push({
            type: "added",
            content: rightWords[j],
          })
        }
        result.push({
          type: "unchanged",
          content: leftWords[leftIndex],
        })
        leftIndex++
        rightIndex = i + 1
        foundMatch = true
        break
      }
    }

    if (foundMatch) {
      continue
    }

    for (let i = leftIndex + 1; i < leftWords.length; i++) {
      if (leftWords[i] === rightWords[rightIndex]) {
        for (let j = leftIndex; j < i; j++) {
          result.push({
            type: "removed",
            content: leftWords[j],
          })
        }
        result.push({
          type: "unchanged",
          content: rightWords[rightIndex],
        })
        leftIndex = i + 1
        rightIndex++
        foundMatch = true
        break
      }
    }

    if (!foundMatch) {
      result.push({
        type: "removed",
        content: leftWords[leftIndex],
      })
      result.push({
        type: "added",
        content: rightWords[rightIndex],
      })
      leftIndex++
      rightIndex++
    }
  }

  return result
}

/**
 * 组合行级与词级 diff 的核心函数。
 */
export const generateDiff = (textA: string, textB: string, settings: DiffSettings): DiffResult => {
  const startTime = performance.now()

  let processedTextA = textA
  let processedTextB = textB

  const totalLength = textA.length + textB.length
  const MAX_TOTAL_LENGTH = 2_000_000
  if (totalLength > MAX_TOTAL_LENGTH) {
    throw new Error("Diff content is too large. Please use smaller files or fewer lines.")
  }

  if (settings.ignoreCase) {
    processedTextA = processedTextA.toLowerCase()
    processedTextB = processedTextB.toLowerCase()
  }

  if (settings.ignoreWhitespace) {
    processedTextA = processedTextA.replace(/\s+/g, " ").trim()
    processedTextB = processedTextB.replace(/\s+/g, " ").trim()
  }

  let lines: DiffLine[]
  switch (settings.algorithm) {
    case "myers":
    default:
      lines = myersDiff(processedTextA, processedTextB)
      break
  }

  if (settings.wordLevelDiff) {
    lines = lines.map((line) => {
      if (line.type === "modified" && line.leftContent && line.rightContent) {
        return {
          ...line,
          wordDiffs: getWordDiff(line.leftContent, line.rightContent),
        }
      }
      return line
    })
  }

  const addedLines = lines.filter((l) => l.type === "added").length
  const removedLines = lines.filter((l) => l.type === "removed").length
  const modifiedLines = lines.filter((l) => l.type === "modified").length
  const unchangedLines = lines.filter((l) => l.type === "unchanged").length

  const addedWords = lines.reduce((sum, line) => {
    if (line.wordDiffs) {
      return sum + line.wordDiffs.filter((w) => w.type === "added").length
    }
    return sum + (line.type === "added" ? line.content.split(/\s+/).length : 0)
  }, 0)

  const removedWords = lines.reduce((sum, line) => {
    if (line.wordDiffs) {
      return sum + line.wordDiffs.filter((w) => w.type === "removed").length
    }
    return sum + (line.type === "removed" ? line.content.split(/\s+/).length : 0)
  }, 0)

  const totalLines = Math.max(textA.split(/\r?\n/).length, textB.split(/\r?\n/).length)
  const similarity = totalLines > 0 ? (unchangedLines / totalLines) * 100 : 100

  const statistics: DiffStatistics = {
    totalLines,
    addedLines,
    removedLines,
    modifiedLines,
    unchangedLines,
    addedWords,
    removedWords,
    similarity,
    executionTime: performance.now() - startTime,
  }

  return {
    lines,
    statistics,
    algorithm: settings.algorithm,
    format: settings.format,
  }
}
