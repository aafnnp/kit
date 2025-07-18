import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Settings,
  BookOpen,
  Clock,
  Layers,
  Gift,
  Trophy,
  Target,
  Sparkles,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  LotteryItem,
  LotteryResult,
  LotterySettings,
  FilterSettings,
  SortSettings,
  LotteryStatistics,
  LotteryBatch,
  BatchSettings,
  BatchStatistics,
  LotteryTemplate,
  LotteryValidation,
  SelectionMode,
  ExportFormat,
} from '@/types/lottery-picker'

// Utility functions

// Lottery generation functions
const parseItems = (input: string, separators: string[] = [',', '，', ';', '；', '\n']): LotteryItem[] => {
  if (!input.trim()) return []

  const pattern = new RegExp(`[${separators.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')}]+`)
  const items = input
    .split(pattern)
    .filter(Boolean)
    .map((item) => item.trim())
    .filter(Boolean)

  return items.map((value) => ({
    id: nanoid(),
    value,
    weight: 1,
    category: detectCategory(value),
    description: '',
    isSelected: false,
    selectionCount: 0,
  }))
}

const detectCategory = (value: string): string => {
  // Simple category detection based on content
  if (/^\d+$/.test(value)) return 'Number'
  if (/^[A-Za-z]+$/.test(value)) return 'Name'
  if (value.includes('@')) return 'Email'
  if (/^https?:\/\//.test(value)) return 'URL'
  if (value.length > 50) return 'Description'
  return 'General'
}

const performLottery = (items: LotteryItem[], settings: LotterySettings): LotteryResult => {
  const validItems = filterItems(items, settings.filterSettings)
  const sortedItems = sortItems(validItems, settings.sortSettings)

  let selectedItems: LotteryItem[] = []

  switch (settings.selectionMode) {
    case 'single':
      selectedItems = selectSingle(sortedItems, settings)
      break
    case 'multiple':
      selectedItems = selectMultiple(sortedItems, settings)
      break
    case 'weighted':
      selectedItems = selectWeighted(sortedItems, settings)
      break
    case 'tournament':
      selectedItems = selectTournament(sortedItems)
      break
    case 'elimination':
      selectedItems = selectElimination(sortedItems, settings)
      break
    case 'round-robin':
      selectedItems = selectRoundRobin(sortedItems)
      break
    default:
      selectedItems = selectSingle(sortedItems, settings)
  }

  // Update selection counts
  selectedItems.forEach((item) => {
    const originalItem = items.find((i) => i.id === item.id)
    if (originalItem) {
      originalItem.selectionCount++
      originalItem.lastSelected = new Date()
      originalItem.isSelected = true
    }
  })

  const statistics = calculateStatistics(items)

  return {
    id: nanoid(),
    items: items,
    selectedItems,
    selectionMode: settings.selectionMode,
    timestamp: new Date(),
    settings,
    statistics,
  }
}

const filterItems = (items: LotteryItem[], filterSettings: FilterSettings): LotteryItem[] => {
  if (!filterSettings.enabled) return items

  return items.filter((item) => {
    // Length filter
    if (item.value.length < filterSettings.minLength || item.value.length > filterSettings.maxLength) {
      return false
    }

    // Exclude patterns
    for (const pattern of filterSettings.excludePatterns) {
      const regex = new RegExp(pattern, filterSettings.caseSensitive ? 'g' : 'gi')
      if (regex.test(item.value)) return false
    }

    // Include patterns (if any specified, item must match at least one)
    if (filterSettings.includePatterns.length > 0) {
      let matches = false
      for (const pattern of filterSettings.includePatterns) {
        const regex = new RegExp(pattern, filterSettings.caseSensitive ? 'g' : 'gi')
        if (regex.test(item.value)) {
          matches = true
          break
        }
      }
      if (!matches) return false
    }

    return true
  })
}

const sortItems = (items: LotteryItem[], sortSettings: SortSettings): LotteryItem[] => {
  if (!sortSettings.enabled) return items

  const sorted = [...items].sort((a, b) => {
    let comparison = 0

    switch (sortSettings.sortBy) {
      case 'alphabetical':
        comparison = a.value.localeCompare(b.value)
        break
      case 'weight':
        comparison = a.weight - b.weight
        break
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '')
        break
      case 'random':
        comparison = Math.random() - 0.5
        break
    }

    return sortSettings.sortOrder === 'desc' ? -comparison : comparison
  })

  return sorted
}

const selectSingle = (items: LotteryItem[], settings: LotterySettings): LotteryItem[] => {
  if (items.length === 0) return []

  let availableItems = items
  if (settings.excludePrevious) {
    availableItems = items.filter((item) => item.selectionCount === 0)
    if (availableItems.length === 0) availableItems = items // Reset if all have been selected
  }

  const randomIndex = Math.floor(Math.random() * availableItems.length)
  return [availableItems[randomIndex]]
}

const selectMultiple = (items: LotteryItem[], settings: LotterySettings): LotteryItem[] => {
  if (items.length === 0) return []

  const count = Math.min(settings.selectionCount, items.length)
  const selected: LotteryItem[] = []
  let availableItems = [...items]

  if (settings.excludePrevious) {
    availableItems = items.filter((item) => item.selectionCount === 0)
    if (availableItems.length === 0) availableItems = [...items] // Reset if all have been selected
  }

  for (let i = 0; i < count; i++) {
    if (availableItems.length === 0) break

    const randomIndex = Math.floor(Math.random() * availableItems.length)
    const selectedItem = availableItems[randomIndex]
    selected.push(selectedItem)

    if (!settings.allowDuplicates) {
      availableItems.splice(randomIndex, 1)
    }
  }

  return selected
}

const selectWeighted = (items: LotteryItem[], settings: LotterySettings): LotteryItem[] => {
  if (items.length === 0) return []

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) return selectSingle(items, settings)

  const random = Math.random() * totalWeight
  let currentWeight = 0

  for (const item of items) {
    currentWeight += item.weight
    if (random <= currentWeight) {
      return [item]
    }
  }

  return [items[items.length - 1]] // Fallback
}

const selectTournament = (items: LotteryItem[]): LotteryItem[] => {
  if (items.length === 0) return []
  if (items.length === 1) return [items[0]]

  // Simple tournament: pair items and randomly select winners
  let contestants = [...items]

  while (contestants.length > 1) {
    const nextRound: LotteryItem[] = []

    for (let i = 0; i < contestants.length; i += 2) {
      if (i + 1 < contestants.length) {
        // Pair exists, randomly select winner
        const winner = Math.random() < 0.5 ? contestants[i] : contestants[i + 1]
        nextRound.push(winner)
      } else {
        // Odd one out, automatically advances
        nextRound.push(contestants[i])
      }
    }

    contestants = nextRound
  }

  return contestants
}

const selectElimination = (items: LotteryItem[], settings: LotterySettings): LotteryItem[] => {
  if (items.length === 0) return []

  const eliminationCount = Math.max(1, Math.floor(items.length * 0.1)) // Eliminate 10%
  let remaining = [...items]

  for (let i = 0; i < eliminationCount && remaining.length > 1; i++) {
    const eliminateIndex = Math.floor(Math.random() * remaining.length)
    remaining.splice(eliminateIndex, 1)
  }

  return selectSingle(remaining, settings)
}

const selectRoundRobin = (items: LotteryItem[]): LotteryItem[] => {
  if (items.length === 0) return []

  // Score each item against all others
  const scores = items.map((item) => ({
    item,
    score: 0,
  }))

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      // Random "match" between items
      if (Math.random() < 0.5) {
        scores[i].score++
      } else {
        scores[j].score++
      }
    }
  }

  // Sort by score and return top item(s)
  scores.sort((a, b) => b.score - a.score)
  return [scores[0].item]
}

const calculateStatistics = (allItems: LotteryItem[]): LotteryStatistics => {
  const totalItems = allItems.length
  const totalSelections = allItems.reduce((sum, item) => sum + item.selectionCount, 0)
  const averageWeight = allItems.reduce((sum, item) => sum + item.weight, 0) / totalItems

  const selectionDistribution: Record<string, number> = {}
  const categoryDistribution: Record<string, number> = {}

  allItems.forEach((item) => {
    selectionDistribution[item.value] = item.selectionCount
    const category = item.category || 'Unknown'
    categoryDistribution[category] = (categoryDistribution[category] || 0) + 1
  })

  // Calculate fairness score (how evenly distributed selections are)
  const expectedSelections = totalSelections / totalItems
  const variance =
    allItems.reduce((sum, item) => {
      const diff = item.selectionCount - expectedSelections
      return sum + diff * diff
    }, 0) / totalItems
  const fairnessScore = Math.max(0, 100 - variance * 10)

  // Calculate randomness score (simplified)
  const randomnessScore = Math.min(100, Math.max(0, 100 - variance * 5))

  return {
    totalItems,
    totalSelections,
    averageWeight,
    selectionDistribution,
    categoryDistribution,
    fairnessScore,
    randomnessScore,
  }
}

// Lottery Templates
const lotteryTemplates: LotteryTemplate[] = [
  {
    id: 'simple-names',
    name: 'Simple Names',
    description: 'Basic name lottery for simple selections',
    category: 'General',
    items: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'],
    settings: {
      selectionMode: 'single',
      selectionCount: 1,
      allowDuplicates: false,
      useWeights: false,
      excludePrevious: false,
      animationEnabled: true,
      soundEnabled: false,
      customSeparators: [',', ';', '\n'],
      filterSettings: {
        enabled: false,
        minLength: 1,
        maxLength: 100,
        excludePatterns: [],
        includePatterns: [],
        caseSensitive: false,
      },
      sortSettings: {
        enabled: false,
        sortBy: 'random',
        sortOrder: 'asc',
      },
    },
    useCase: ['Team selection', 'Random picking', 'Name drawing', 'Simple lottery'],
    examples: ['Picking a winner', 'Selecting team members', 'Random name selection', 'Door prize drawing'],
    preview: 'Simple single-selection lottery',
  },
  {
    id: 'team-picker',
    name: 'Team Picker',
    description: 'Select multiple people for teams or groups',
    category: 'Teams',
    items: ['Alex', 'Beth', 'Chris', 'Dana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia'],
    settings: {
      selectionMode: 'multiple',
      selectionCount: 3,
      allowDuplicates: false,
      useWeights: false,
      excludePrevious: true,
      animationEnabled: true,
      soundEnabled: true,
      customSeparators: [',', ';', '\n'],
      filterSettings: {
        enabled: false,
        minLength: 1,
        maxLength: 100,
        excludePatterns: [],
        includePatterns: [],
        caseSensitive: false,
      },
      sortSettings: {
        enabled: false,
        sortBy: 'random',
        sortOrder: 'asc',
      },
    },
    useCase: ['Team formation', 'Group selection', 'Committee picking', 'Project teams'],
    examples: [
      'Forming work teams',
      'Selecting committee members',
      'Creating study groups',
      'Picking project partners',
    ],
    preview: 'Multi-selection team formation',
  },
  {
    id: 'weighted-prizes',
    name: 'Weighted Prizes',
    description: 'Prize lottery with different winning probabilities',
    category: 'Prizes',
    items: ['Grand Prize', 'Second Prize', 'Third Prize', 'Consolation Prize', 'Thank You Gift'],
    settings: {
      selectionMode: 'weighted',
      selectionCount: 1,
      allowDuplicates: true,
      useWeights: true,
      excludePrevious: false,
      animationEnabled: true,
      soundEnabled: true,
      customSeparators: [',', ';', '\n'],
      filterSettings: {
        enabled: false,
        minLength: 1,
        maxLength: 100,
        excludePatterns: [],
        includePatterns: [],
        caseSensitive: false,
      },
      sortSettings: {
        enabled: true,
        sortBy: 'weight',
        sortOrder: 'desc',
      },
    },
    useCase: ['Prize drawings', 'Raffle systems', 'Reward distribution', 'Contest winners'],
    examples: ['Company raffle', 'Contest prizes', 'Reward system', 'Lucky draw'],
    preview: 'Weighted probability prize selection',
  },
  {
    id: 'tournament-bracket',
    name: 'Tournament Bracket',
    description: 'Tournament-style elimination selection',
    category: 'Competition',
    items: [
      'Team Alpha',
      'Team Beta',
      'Team Gamma',
      'Team Delta',
      'Team Epsilon',
      'Team Zeta',
      'Team Eta',
      'Team Theta',
    ],
    settings: {
      selectionMode: 'tournament',
      selectionCount: 1,
      allowDuplicates: false,
      useWeights: false,
      excludePrevious: false,
      animationEnabled: true,
      soundEnabled: true,
      customSeparators: [',', ';', '\n'],
      filterSettings: {
        enabled: false,
        minLength: 1,
        maxLength: 100,
        excludePatterns: [],
        includePatterns: [],
        caseSensitive: false,
      },
      sortSettings: {
        enabled: true,
        sortBy: 'random',
        sortOrder: 'asc',
      },
    },
    useCase: ['Tournament selection', 'Competition brackets', 'Elimination games', 'Championship draws'],
    examples: ['Sports tournaments', 'Game competitions', 'Debate tournaments', 'Contest brackets'],
    preview: 'Tournament-style elimination',
  },
  {
    id: 'restaurant-picker',
    name: 'Restaurant Picker',
    description: 'Choose where to eat with elimination process',
    category: 'Lifestyle',
    items: [
      'Italian Restaurant',
      'Chinese Takeout',
      'Mexican Grill',
      'Burger Joint',
      'Sushi Bar',
      'Pizza Place',
      'Thai Kitchen',
      'Indian Cuisine',
    ],
    settings: {
      selectionMode: 'elimination',
      selectionCount: 1,
      allowDuplicates: false,
      useWeights: false,
      excludePrevious: false,
      animationEnabled: true,
      soundEnabled: false,
      customSeparators: [',', ';', '\n'],
      filterSettings: {
        enabled: false,
        minLength: 1,
        maxLength: 100,
        excludePatterns: [],
        includePatterns: [],
        caseSensitive: false,
      },
      sortSettings: {
        enabled: false,
        sortBy: 'random',
        sortOrder: 'asc',
      },
    },
    useCase: ['Decision making', 'Food choices', 'Activity selection', 'Option elimination'],
    examples: ['Choosing restaurants', 'Picking activities', 'Selecting movies', 'Decision assistance'],
    preview: 'Elimination-based decision making',
  },
  {
    id: 'round-robin-scheduler',
    name: 'Round Robin Scheduler',
    description: 'Fair scheduling with round-robin selection',
    category: 'Scheduling',
    items: ['Monday Shift', 'Tuesday Shift', 'Wednesday Shift', 'Thursday Shift', 'Friday Shift', 'Weekend Shift'],
    settings: {
      selectionMode: 'round-robin',
      selectionCount: 1,
      allowDuplicates: false,
      useWeights: false,
      excludePrevious: true,
      animationEnabled: false,
      soundEnabled: false,
      customSeparators: [',', ';', '\n'],
      filterSettings: {
        enabled: false,
        minLength: 1,
        maxLength: 100,
        excludePatterns: [],
        includePatterns: [],
        caseSensitive: false,
      },
      sortSettings: {
        enabled: true,
        sortBy: 'alphabetical',
        sortOrder: 'asc',
      },
    },
    useCase: ['Work scheduling', 'Fair rotation', 'Task assignment', 'Duty roster'],
    examples: ['Work shifts', 'Cleaning duties', 'Presentation order', 'Meeting rotation'],
    preview: 'Fair round-robin scheduling',
  },
]

// Validation functions
const validateLottery = (items: LotteryItem[], settings: LotterySettings): LotteryValidation => {
  const validation: LotteryValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  // Items validation
  if (items.length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: 'No items provided for lottery',
      type: 'items',
      severity: 'error',
    })
    validation.qualityScore -= 50
  }

  if (items.length === 1 && settings.selectionMode === 'multiple' && settings.selectionCount > 1) {
    validation.warnings.push('Only one item available but multiple selection requested')
    validation.qualityScore -= 10
  }

  // Check for duplicate items
  const duplicates = findDuplicateItems(items)
  if (duplicates.length > 0) {
    validation.warnings.push(`Found ${duplicates.length} duplicate items`)
    validation.suggestions.push('Consider removing duplicates or using weights')
    validation.qualityScore -= 5
  }

  // Settings validation
  if (settings.selectionCount <= 0) {
    validation.isValid = false
    validation.errors.push({
      message: 'Selection count must be greater than 0',
      type: 'settings',
      severity: 'error',
    })
    validation.qualityScore -= 20
  }

  if (settings.selectionCount > items.length && !settings.allowDuplicates) {
    validation.isValid = false
    validation.errors.push({
      message: 'Selection count exceeds available items (duplicates not allowed)',
      type: 'settings',
      severity: 'error',
    })
    validation.qualityScore -= 15
  }

  // Weights validation
  if (settings.useWeights) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    if (totalWeight === 0) {
      validation.warnings.push('All items have zero weight')
      validation.suggestions.push('Assign positive weights to items')
      validation.qualityScore -= 15
    }

    const negativeWeights = items.filter((item) => item.weight < 0)
    if (negativeWeights.length > 0) {
      validation.errors.push({
        message: 'Items cannot have negative weights',
        type: 'weights',
        severity: 'error',
      })
      validation.isValid = false
      validation.qualityScore -= 20
    }
  }

  // Filter validation
  if (settings.filterSettings.enabled) {
    const filteredItems = filterItems(items, settings.filterSettings)
    if (filteredItems.length === 0) {
      validation.warnings.push('All items filtered out by current filter settings')
      validation.suggestions.push('Adjust filter settings to include more items')
      validation.qualityScore -= 25
    }
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push('Excellent lottery configuration')
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push('Good lottery setup, minor improvements possible')
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push('Lottery configuration needs improvement')
  } else {
    validation.suggestions.push('Lottery configuration has significant issues')
  }

  return validation
}

const findDuplicateItems = (items: LotteryItem[]): LotteryItem[] => {
  const seen = new Set<string>()
  const duplicates: LotteryItem[] = []

  items.forEach((item) => {
    if (seen.has(item.value.toLowerCase())) {
      duplicates.push(item)
    } else {
      seen.add(item.value.toLowerCase())
    }
  })

  return duplicates
}

// Custom hooks
const useLotteryPicker = () => {
  const [results, setResults] = useState<LotteryResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const performDraw = useCallback(async (items: LotteryItem[], settings: LotterySettings): Promise<LotteryResult> => {
    setIsProcessing(true)
    try {
      // Add animation delay if enabled
      if (settings.animationEnabled) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      const result = performLottery(items, settings)
      setResults((prev) => [result, ...prev])
      return result
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const performBatch = useCallback(
    async (items: LotteryItem[], batchSettings: BatchSettings): Promise<LotteryBatch> => {
      setIsProcessing(true)
      const startTime = performance.now()

      try {
        const batch: LotteryBatch = {
          id: nanoid(),
          name: batchSettings.namingPattern || 'Lottery Batch',
          results: [],
          settings: batchSettings,
          status: 'processing',
          progress: 0,
          statistics: {
            totalIterations: 0,
            successfulIterations: 0,
            failedIterations: 0,
            averageFairnessScore: 0,
            averageRandomnessScore: 0,
            totalProcessingTime: 0,
            averageProcessingTime: 0,
            itemFrequency: {},
          },
          createdAt: new Date(),
        }

        const batchResults: LotteryResult[] = []

        for (let i = 0; i < batchSettings.iterations; i++) {
          try {
            const result = performLottery(items, batchSettings.baseSettings)
            batchResults.push(result)

            // Update progress
            const progress = ((i + 1) / batchSettings.iterations) * 100
            batch.progress = progress
          } catch (error) {
            console.error('Failed to perform lottery draw:', error)
          }
        }

        const endTime = performance.now()
        const totalProcessingTime = endTime - startTime

        // Calculate statistics
        const successful = batchResults.filter((r) => r.selectedItems.length > 0)
        const itemFrequency: Record<string, number> = {}
        let totalFairness = 0
        let totalRandomness = 0

        successful.forEach((result) => {
          result.selectedItems.forEach((item) => {
            itemFrequency[item.value] = (itemFrequency[item.value] || 0) + 1
          })
          totalFairness += result.statistics.fairnessScore
          totalRandomness += result.statistics.randomnessScore
        })

        const statistics: BatchStatistics = {
          totalIterations: batchResults.length,
          successfulIterations: successful.length,
          failedIterations: batchResults.length - successful.length,
          averageFairnessScore: successful.length > 0 ? totalFairness / successful.length : 0,
          averageRandomnessScore: successful.length > 0 ? totalRandomness / successful.length : 0,
          totalProcessingTime,
          averageProcessingTime: totalProcessingTime / batchResults.length,
          itemFrequency,
        }

        batch.results = batchResults
        batch.status = 'completed'
        batch.progress = 100
        batch.statistics = statistics
        batch.completedAt = new Date()

        setResults((prev) => [...batchResults, ...prev])
        return batch
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const clearResults = useCallback(() => {
    setResults([])
  }, [])

  const removeResult = useCallback((id: string) => {
    setResults((prev) => prev.filter((result) => result.id !== id))
  }, [])

  return {
    results,
    isProcessing,
    performDraw,
    performBatch,
    clearResults,
    removeResult,
  }
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useLotteryExport = () => {
  const exportResult = useCallback((result: LotteryResult, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(result, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromResult(result)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'txt':
        content = generateTextFromResult(result)
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'xml':
        content = generateXMLFromResult(result)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'yaml':
        content = generateYAMLFromResult(result)
        mimeType = 'text/yaml'
        extension = '.yaml'
        break
      default:
        content = result.selectedItems.map((item) => item.value).join('\n')
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `lottery-result-${result.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback((batch: LotteryBatch) => {
    const content = JSON.stringify(batch, null, 2)
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${batch.name}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResult, exportBatch }
}

// Helper functions for export formats
const generateCSVFromResult = (result: LotteryResult): string => {
  const headers = ['Selected Item', 'Weight', 'Category', 'Selection Count', 'Timestamp']
  const rows = result.selectedItems.map((item) => [
    item.value,
    item.weight.toString(),
    item.category || '',
    item.selectionCount.toString(),
    result.timestamp.toISOString(),
  ])

  return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
}

const generateTextFromResult = (result: LotteryResult): string => {
  return `Lottery Result - ${result.timestamp.toLocaleString()}
Selection Mode: ${result.selectionMode}
Selected Items: ${result.selectedItems.map((item) => item.value).join(', ')}

Statistics:
- Total Items: ${result.statistics.totalItems}
- Fairness Score: ${result.statistics.fairnessScore.toFixed(1)}%
- Randomness Score: ${result.statistics.randomnessScore.toFixed(1)}%`
}

const generateXMLFromResult = (result: LotteryResult): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<lotteryResult id="${result.id}" timestamp="${result.timestamp.toISOString()}">
  <selectionMode>${result.selectionMode}</selectionMode>
  <selectedItems>
    ${result.selectedItems
      .map(
        (item) => `
    <item>
      <value>${item.value}</value>
      <weight>${item.weight}</weight>
      <category>${item.category || ''}</category>
      <selectionCount>${item.selectionCount}</selectionCount>
    </item>`
      )
      .join('')}
  </selectedItems>
  <statistics>
    <totalItems>${result.statistics.totalItems}</totalItems>
    <fairnessScore>${result.statistics.fairnessScore}</fairnessScore>
    <randomnessScore>${result.statistics.randomnessScore}</randomnessScore>
  </statistics>
</lotteryResult>`
}

const generateYAMLFromResult = (result: LotteryResult): string => {
  return `id: ${result.id}
timestamp: ${result.timestamp.toISOString()}
selectionMode: ${result.selectionMode}
selectedItems:
${result.selectedItems
  .map(
    (item) => `  - value: ${item.value}
    weight: ${item.weight}
    category: ${item.category || ''}
    selectionCount: ${item.selectionCount}`
  )
  .join('\n')}
statistics:
  totalItems: ${result.statistics.totalItems}
  fairnessScore: ${result.statistics.fairnessScore}
  randomnessScore: ${result.statistics.randomnessScore}`
}

/**
 * Enhanced Lottery Picker & Management Tool
 * Features: Advanced lottery selection, customization, analysis, and batch processing
 */
const LotteryPickerCore = () => {
  const [activeTab, setActiveTab] = useState<'picker' | 'batch' | 'history' | 'templates'>('picker')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [currentResult, setCurrentResult] = useState<LotteryResult | null>(null)
  const [items, setItems] = useState<LotteryItem[]>([])
  const [inputText, setInputText] = useState('')
  const [settings, setSettings] = useState<LotterySettings>({
    selectionMode: 'single',
    selectionCount: 1,
    allowDuplicates: false,
    useWeights: false,
    excludePrevious: false,
    animationEnabled: true,
    soundEnabled: false,
    customSeparators: [',', '，', ';', '；', '\n'],
    filterSettings: {
      enabled: false,
      minLength: 1,
      maxLength: 100,
      excludePatterns: [],
      includePatterns: [],
      caseSensitive: false,
    },
    sortSettings: {
      enabled: false,
      sortBy: 'random',
      sortOrder: 'asc',
    },
  })

  const { results, isProcessing, performDraw, removeResult } = useLotteryPicker()
  const { exportResult } = useLotteryExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Parse input text into items
  useEffect(() => {
    const parsedItems = parseItems(inputText, settings.customSeparators)
    setItems(parsedItems)
  }, [inputText, settings.customSeparators])

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = lotteryTemplates.find((t) => t.id === templateId)
    if (template) {
      setInputText(template.items.join('\n'))
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Perform lottery draw
  const handleDraw = useCallback(async () => {
    const validation = validateLottery(items, settings)
    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(error.message)
      })
      return
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast.warning(warning)
      })
    }

    try {
      const result = await performDraw(items, settings)
      setCurrentResult(result)

      if (result.selectedItems.length > 0) {
        toast.success(`Selected: ${result.selectedItems.map((item) => item.value).join(', ')}`)
      } else {
        toast.error('No items were selected')
      }
    } catch (error) {
      toast.error('Failed to perform lottery draw')
      console.error(error)
    }
  }, [items, settings, performDraw])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" aria-hidden="true" />
              Lottery Picker & Management Tool
            </CardTitle>
            <CardDescription>
              Advanced lottery and random selection tool with comprehensive customization, analysis, and batch
              processing. Create fair and random selections with multiple selection modes and detailed analytics. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'picker' | 'batch' | 'history' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="picker" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Picker
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Lottery Picker Tab */}
          <TabsContent value="picker" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Picker Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Lottery Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items Input */}
                  <div>
                    <Label htmlFor="items-input" className="text-sm font-medium">
                      Items to Pick From
                    </Label>
                    <Textarea
                      id="items-input"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Enter items separated by commas, semicolons, or new lines..."
                      className="mt-2"
                      rows={6}
                    />
                    <div className="text-xs text-muted-foreground mt-1">{items.length} items detected</div>
                  </div>

                  {/* Selection Mode */}
                  <div>
                    <Label htmlFor="selection-mode" className="text-sm font-medium">
                      Selection Mode
                    </Label>
                    <Select
                      value={settings.selectionMode}
                      onValueChange={(value: SelectionMode) =>
                        setSettings((prev) => ({ ...prev, selectionMode: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Selection</SelectItem>
                        <SelectItem value="multiple">Multiple Selection</SelectItem>
                        <SelectItem value="weighted">Weighted Selection</SelectItem>
                        <SelectItem value="tournament">Tournament Style</SelectItem>
                        <SelectItem value="elimination">Elimination Process</SelectItem>
                        <SelectItem value="round-robin">Round Robin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selection Count */}
                  {settings.selectionMode === 'multiple' && (
                    <div>
                      <Label htmlFor="selection-count" className="text-sm font-medium">
                        Number to Select
                      </Label>
                      <Input
                        id="selection-count"
                        type="number"
                        min="1"
                        max={items.length}
                        value={settings.selectionCount}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, selectionCount: parseInt(e.target.value) || 1 }))
                        }
                        className="mt-2"
                      />
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Options</Label>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="allow-duplicates"
                          type="checkbox"
                          checked={settings.allowDuplicates}
                          onChange={(e) => setSettings((prev) => ({ ...prev, allowDuplicates: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="allow-duplicates" className="text-xs">
                          Allow duplicate selections
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="use-weights"
                          type="checkbox"
                          checked={settings.useWeights}
                          onChange={(e) => setSettings((prev) => ({ ...prev, useWeights: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="use-weights" className="text-xs">
                          Use weighted selection
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="exclude-previous"
                          type="checkbox"
                          checked={settings.excludePrevious}
                          onChange={(e) => setSettings((prev) => ({ ...prev, excludePrevious: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="exclude-previous" className="text-xs">
                          Exclude previously selected items
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="animation-enabled"
                          type="checkbox"
                          checked={settings.animationEnabled}
                          onChange={(e) => setSettings((prev) => ({ ...prev, animationEnabled: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="animation-enabled" className="text-xs">
                          Enable selection animation
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleDraw} disabled={isProcessing || items.length === 0} className="flex-1">
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? 'Drawing...' : 'Draw Lottery'}
                    </Button>
                    <Button
                      onClick={() => {
                        setInputText('')
                        setItems([])
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Lottery Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Lottery Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      {/* Selected Items Display */}
                      <div className="text-center">
                        <div className="p-6 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                          {currentResult.selectedItems.length > 0 ? (
                            <div className="space-y-3">
                              <div className="text-2xl font-bold text-primary">
                                🎉 Winner{currentResult.selectedItems.length > 1 ? 's' : ''}!
                              </div>
                              <div className="space-y-2">
                                {currentResult.selectedItems.map((item, index) => (
                                  <div key={item.id} className="text-lg font-semibold p-2 bg-white rounded border">
                                    {currentResult.selectedItems.length > 1 && (
                                      <span className="text-sm text-muted-foreground mr-2">#{index + 1}</span>
                                    )}
                                    {item.value}
                                    {settings.useWeights && (
                                      <span className="text-sm text-muted-foreground ml-2">
                                        (weight: {item.weight})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No items selected</div>
                          )}
                        </div>
                      </div>

                      {/* Result Information */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div>
                            <strong>Selection Mode:</strong> {currentResult.selectionMode}
                          </div>
                          <div>
                            <strong>Total Items:</strong> {currentResult.statistics.totalItems}
                          </div>
                          <div>
                            <strong>Selected:</strong> {currentResult.selectedItems.length}
                          </div>
                        </div>
                        <div>
                          <div>
                            <strong>Timestamp:</strong> {currentResult.timestamp.toLocaleTimeString()}
                          </div>
                          <div>
                            <strong>Fairness Score:</strong> {currentResult.statistics.fairnessScore.toFixed(1)}%
                          </div>
                          <div>
                            <strong>Randomness:</strong> {currentResult.statistics.randomnessScore.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div className="space-y-3 border-t pt-4">
                        <Label className="text-sm font-medium">Selection Statistics</Label>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Fairness</div>
                            <div className="text-lg">{currentResult.statistics.fairnessScore.toFixed(0)}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div
                                className={`h-1 rounded-full ${
                                  currentResult.statistics.fairnessScore >= 80
                                    ? 'bg-green-500'
                                    : currentResult.statistics.fairnessScore >= 60
                                      ? 'bg-orange-500'
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${currentResult.statistics.fairnessScore}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Randomness</div>
                            <div className="text-lg">{currentResult.statistics.randomnessScore.toFixed(0)}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div
                                className={`h-1 rounded-full ${
                                  currentResult.statistics.randomnessScore >= 80
                                    ? 'bg-green-500'
                                    : currentResult.statistics.randomnessScore >= 60
                                      ? 'bg-orange-500'
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${currentResult.statistics.randomnessScore}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Categories</div>
                            <div className="text-lg">
                              {Object.keys(currentResult.statistics.categoryDistribution).length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Object.entries(currentResult.statistics.categoryDistribution)
                                .slice(0, 2)
                                .map(([cat, count]) => `${cat}: ${count}`)
                                .join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={() => exportResult(currentResult, 'json')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button onClick={() => exportResult(currentResult, 'csv')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button onClick={() => exportResult(currentResult, 'txt')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          TXT
                        </Button>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              currentResult.selectedItems.map((item) => item.value).join('\n'),
                              'Selected Items'
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === 'Selected Items' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Lottery Result</h3>
                      <p className="text-muted-foreground mb-4">
                        Add items and click "Draw Lottery" to perform a selection
                      </p>
                      {items.length > 0 && (
                        <div className="text-sm text-muted-foreground">Ready to draw from {items.length} items</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Placeholder for other tabs */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Batch Lottery Processing</CardTitle>
                <CardDescription>Perform multiple lottery draws for statistical analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
                  <p className="text-muted-foreground">Batch lottery processing functionality coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lottery History</CardTitle>
                <CardDescription>View and analyze your lottery results</CardDescription>
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="space-y-4">
                    {results.slice(0, 10).map((result) => (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">{result.timestamp.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{result.selectionMode}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Selected:</strong> {result.selectedItems.map((item) => item.value).join(', ')}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div>Items: {result.statistics.totalItems}</div>
                            <div>Fairness: {result.statistics.fairnessScore.toFixed(0)}%</div>
                            <div>Randomness: {result.statistics.randomnessScore.toFixed(0)}%</div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => exportResult(result, 'json')}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => removeResult(result.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {results.length > 10 && (
                      <div className="text-center text-sm text-muted-foreground">
                        Showing 10 of {results.length} results
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History</h3>
                    <p className="text-muted-foreground">Perform some lottery draws to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lottery Templates</CardTitle>
                <CardDescription>Pre-configured lottery templates for common use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lotteryTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">Use Cases:</div>
                            <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Examples:</div>
                            <div className="text-xs text-muted-foreground">{template.examples.join(', ')}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Items ({template.items.length}):</div>
                            <div className="text-xs text-muted-foreground">
                              {template.items.slice(0, 3).join(', ')}
                              {template.items.length > 3 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const LotteryPicker = () => {
  return <LotteryPickerCore />
}

export default LotteryPicker
