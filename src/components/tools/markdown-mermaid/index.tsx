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
  Eye,
  Clock,
  Split,
  Code,
  Play,
  Maximize2,
  ChartArea,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  MermaidDiagram,
  DiagramMetadata,
  MermaidConfig,
  DiagramTemplate,
  DiagramValidation,
  DiagramError,
  MermaidDiagramType,
  ExportFormat,
  ViewMode,
} from '@/types/markdown-mermaid'
import { formatFileSize } from '@/lib/utils'

// Utility functions

// Mermaid analysis and rendering functions
let mermaidModule: any | null = null

const loadMermaid = async () => {
  if (mermaidModule) return mermaidModule
  const mod: any = await import('mermaid')
  // mermaid v10/v11 可能导出在 default 上，统一兼容
  const api = mod?.default ?? mod
  mermaidModule = api
  return api
}

const initializeMermaid = async (config: Partial<MermaidConfig> = {}) => {
  const defaultConfig = createDefaultMermaidConfig()
  const mergedConfig = { ...defaultConfig, ...config }

  const mermaid = await loadMermaid()
  mermaid.initialize({
    startOnLoad: false,
    theme: mergedConfig.theme,
    themeVariables: {
      primaryColor: mergedConfig.primaryColor,
      primaryTextColor: mergedConfig.primaryTextColor,
      primaryBorderColor: mergedConfig.primaryBorderColor,
      lineColor: mergedConfig.lineColor,
      secondaryColor: mergedConfig.secondaryColor,
      tertiaryColor: mergedConfig.tertiaryColor,
      background: mergedConfig.background,
      mainBkg: mergedConfig.mainBkg,
      secondBkg: mergedConfig.secondBkg,
      tertiaryBkg: mergedConfig.tertiaryBkg,
    },
    flowchart: mergedConfig.flowchart,
    sequence: mergedConfig.sequence,
    gantt: {
      ...mergedConfig.gantt,
      // 修正 displayMode 类型，确保为 "" | "compact" | undefined
      displayMode: mergedConfig.gantt?.displayMode === 'compact' ? 'compact' : undefined,
    },
    journey: mergedConfig.journey,
    pie: mergedConfig.pie,
    gitGraph: mergedConfig.gitgraph,
    fontFamily: mergedConfig.fontFamily,
    fontSize: mergedConfig.fontSize,
  })
}

const renderMermaidDiagram = async (code: string, config: MermaidConfig): Promise<MermaidDiagram> => {
  const startTime = performance.now()
  const id = nanoid()

  try {
    // Initialize Mermaid with config
    await initializeMermaid(config)

    // Clean and validate code
    const cleanCode = code.trim()
    if (!cleanCode) {
      throw new Error('Empty diagram code')
    }

    // Detect diagram type
    const diagramType = detectDiagramType(cleanCode)

    // Render the diagram
    const mermaid = await loadMermaid()
    const { svg } = await mermaid.render(`mermaid-${id}`, cleanCode)

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Analyze the diagram
    const metadata = analyzeDiagram(cleanCode, svg, renderTime)

    // Create markdown wrapper
    const markdown = `\`\`\`mermaid\n${cleanCode}\n\`\`\``

    return {
      id,
      name: `${diagramType} Diagram`,
      type: diagramType,
      code: cleanCode,
      svg,
      markdown,
      metadata,
      config,
      timestamp: new Date(),
    }
  } catch (error) {
    throw new Error(`Failed to render diagram: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const detectDiagramType = (code: string): MermaidDiagramType => {
  const trimmedCode = code.trim().toLowerCase()

  if (trimmedCode.startsWith('flowchart') || trimmedCode.startsWith('graph')) {
    return 'flowchart'
  } else if (trimmedCode.startsWith('sequencediagram')) {
    return 'sequence'
  } else if (trimmedCode.startsWith('classdiagram')) {
    return 'classDiagram'
  } else if (trimmedCode.startsWith('statediagram')) {
    return 'stateDiagram'
  } else if (trimmedCode.startsWith('erdiagram')) {
    return 'entityRelationship'
  } else if (trimmedCode.startsWith('journey')) {
    return 'userJourney'
  } else if (trimmedCode.startsWith('gantt')) {
    return 'gantt'
  } else if (trimmedCode.startsWith('pie')) {
    return 'pie'
  } else if (trimmedCode.startsWith('gitgraph')) {
    return 'gitgraph'
  } else if (trimmedCode.startsWith('mindmap')) {
    return 'mindmap'
  } else if (trimmedCode.startsWith('timeline')) {
    return 'timeline'
  } else if (trimmedCode.startsWith('quadrantchart')) {
    return 'quadrantChart'
  } else if (trimmedCode.startsWith('requirementdiagram')) {
    return 'requirementDiagram'
  } else if (trimmedCode.startsWith('c4context')) {
    return 'c4Context'
  } else {
    // Default to flowchart for unknown types
    return 'flowchart'
  }
}

const analyzeDiagram = (code: string, svg: string, renderTime: number): DiagramMetadata => {
  const codeSize = code.length
  const svgSize = svg.length

  // Count nodes and edges (simplified analysis)
  const nodeCount = countNodes(code)
  const edgeCount = countEdges(code)

  // Calculate complexity score
  const complexity = calculateComplexity(code, nodeCount, edgeCount)

  // Calculate diagram depth (for hierarchical diagrams)
  const diagramDepth = calculateDiagramDepth(code)

  return {
    codeSize,
    svgSize,
    nodeCount,
    edgeCount,
    complexity,
    renderTime,
    memoryUsage: (codeSize + svgSize) * 2, // Rough estimation
    diagramDepth,
  }
}

const countNodes = (code: string): number => {
  // Count various node patterns
  const patterns = [
    /\w+\[.*?\]/g, // Rectangle nodes
    /\w+\(.*?\)/g, // Round nodes
    /\w+\{.*?\}/g, // Rhombus nodes
    /\w+\(\(.*?\)\)/g, // Circle nodes
    /\w+>.*?]/g, // Asymmetric nodes
    /\w+[\w\s]+/g, // Simple nodes
  ]

  let totalNodes = 0
  patterns.forEach((pattern) => {
    const matches = code.match(pattern)
    if (matches) {
      totalNodes += matches.length
    }
  })

  // Remove duplicates by counting unique node identifiers
  const nodeIds = new Set()
  const nodePattern = /(\w+)(?:\[|\(|\{|>|--)/g
  let match
  while ((match = nodePattern.exec(code)) !== null) {
    nodeIds.add(match[1])
  }

  return Math.max(nodeIds.size, Math.floor(totalNodes / 2))
}

const countEdges = (code: string): number => {
  // Count various edge patterns
  const edgePatterns = [
    /-->/g, // Arrow
    /---/g, // Line
    /-\.->/g, // Dotted arrow
    /-\.\./g, // Dotted line
    /==>/g, // Thick arrow
    /===/g, // Thick line
    /-\.-/g, // Dash dot
    /\|\|--/g, // Parallel
    /--\|/g, // End
  ]

  let totalEdges = 0
  edgePatterns.forEach((pattern) => {
    const matches = code.match(pattern)
    if (matches) {
      totalEdges += matches.length
    }
  })

  return totalEdges
}

const calculateComplexity = (code: string, nodeCount: number, edgeCount: number): number => {
  // Base complexity from nodes and edges
  let complexity = nodeCount + edgeCount

  // Add complexity for nesting (subgraphs, classes, etc.)
  const nestingPatterns = [/subgraph/gi, /class/gi, /state/gi, /participant/gi]

  nestingPatterns.forEach((pattern) => {
    const matches = code.match(pattern)
    if (matches) {
      complexity += matches.length * 2
    }
  })

  // Add complexity for conditional logic
  const conditionalPatterns = [/if/gi, /else/gi, /choice/gi, /fork/gi, /join/gi]

  conditionalPatterns.forEach((pattern) => {
    const matches = code.match(pattern)
    if (matches) {
      complexity += matches.length * 1.5
    }
  })

  return Math.round(complexity)
}

const calculateDiagramDepth = (code: string): number => {
  // Count nesting levels for hierarchical diagrams
  const lines = code.split('\n')
  let maxDepth = 0
  let currentDepth = 0

  lines.forEach((line) => {
    const trimmedLine = line.trim()

    // Count opening brackets/keywords that increase depth
    if (
      trimmedLine.includes('subgraph') ||
      trimmedLine.includes('class') ||
      trimmedLine.includes('state') ||
      trimmedLine.includes('{')
    ) {
      currentDepth++
      maxDepth = Math.max(maxDepth, currentDepth)
    }

    // Count closing brackets that decrease depth
    if (trimmedLine.includes('end') || trimmedLine.includes('}')) {
      currentDepth = Math.max(0, currentDepth - 1)
    }
  })

  return maxDepth
}

// Validation functions
const validateMermaidCode = (code: string): DiagramValidation => {
  const validation: DiagramValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  if (!code || code.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: 'Diagram code cannot be empty',
      type: 'syntax',
      severity: 'error',
    })
    validation.qualityScore = 0
    return validation
  }

  const trimmedCode = code.trim()

  // Check for basic syntax issues
  if (!hasValidDiagramType(trimmedCode)) {
    validation.warnings.push('Diagram type not explicitly specified, defaulting to flowchart')
    validation.suggestions.push('Consider adding a diagram type declaration (e.g., "flowchart TD")')
    validation.qualityScore -= 10
  }

  // Check for complexity issues
  const nodeCount = countNodes(trimmedCode)
  const edgeCount = countEdges(trimmedCode)

  if (nodeCount > 50) {
    validation.warnings.push('High number of nodes may impact rendering performance')
    validation.suggestions.push('Consider breaking down complex diagrams into smaller components')
    validation.qualityScore -= 15
  }

  if (edgeCount > 100) {
    validation.warnings.push('High number of edges may make diagram difficult to read')
    validation.suggestions.push('Simplify connections or use subgraphs to organize content')
    validation.qualityScore -= 10
  }

  // Check for common syntax errors
  const syntaxErrors = checkSyntaxErrors(trimmedCode)
  if (syntaxErrors.length > 0) {
    validation.errors.push(...syntaxErrors)
    validation.isValid = false
    validation.qualityScore -= 30
  }

  // Check for best practices
  const bestPracticeIssues = checkBestPractices(trimmedCode)
  if (bestPracticeIssues.length > 0) {
    validation.suggestions.push(...bestPracticeIssues)
    validation.qualityScore -= 5
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push('Excellent diagram structure')
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push('Good diagram with minor improvements possible')
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push('Diagram needs improvement')
  } else {
    validation.suggestions.push('Diagram has significant issues')
  }

  return validation
}

const hasValidDiagramType = (code: string): boolean => {
  const diagramTypes = [
    'flowchart',
    'graph',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'erDiagram',
    'journey',
    'gantt',
    'pie',
    'gitgraph',
    'mindmap',
    'timeline',
    'quadrantChart',
    'requirementDiagram',
    'c4Context',
  ]

  const firstLine = code.split('\n')[0].trim().toLowerCase()
  return diagramTypes.some((type) => firstLine.startsWith(type.toLowerCase()))
}

const checkSyntaxErrors = (code: string): DiagramError[] => {
  const errors: DiagramError[] = []
  const lines = code.split('\n')

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    // Check for unmatched brackets
    const openBrackets = (trimmedLine.match(/[\[\(\{]/g) || []).length
    const closeBrackets = (trimmedLine.match(/[\]\)\}]/g) || []).length

    if (openBrackets !== closeBrackets) {
      errors.push({
        message: 'Unmatched brackets in line',
        type: 'syntax',
        severity: 'error',
        line: index + 1,
      })
    }

    // Check for invalid characters in node IDs
    const nodeIdPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/
    const nodeMatches = trimmedLine.match(/(\w+)(?:\[|\(|\{)/g)

    if (nodeMatches) {
      nodeMatches.forEach((match) => {
        const nodeId = match.replace(/[\[\(\{].*/, '')
        if (!nodeIdPattern.test(nodeId)) {
          errors.push({
            message: `Invalid node ID: ${nodeId}`,
            type: 'syntax',
            severity: 'warning',
            line: index + 1,
          })
        }
      })
    }
  })

  return errors
}

const checkBestPractices = (code: string): string[] => {
  const suggestions: string[] = []

  // Check for descriptive node labels
  const nodePattern = /\w+\[([^\]]*)\]/g
  let match
  let hasDescriptiveLabels = false

  while ((match = nodePattern.exec(code)) !== null) {
    if (match[1] && match[1].trim().length > 2) {
      hasDescriptiveLabels = true
      break
    }
  }

  if (!hasDescriptiveLabels) {
    suggestions.push('Use descriptive labels for better diagram readability')
  }

  // Check for consistent naming convention
  const nodeIds = []
  const nodeIdPattern = /(\w+)(?:\[|\(|\{)/g
  while ((match = nodeIdPattern.exec(code)) !== null) {
    nodeIds.push(match[1])
  }

  const hasCamelCase = nodeIds.some((id) => /[a-z][A-Z]/.test(id))
  const hasSnakeCase = nodeIds.some((id) => /_/.test(id))

  if (hasCamelCase && hasSnakeCase) {
    suggestions.push('Use consistent naming convention (either camelCase or snake_case)')
  }

  // Check for diagram title/description
  if (!code.includes('title') && !code.includes('%%')) {
    suggestions.push('Consider adding a title or description to your diagram')
  }

  return suggestions
}

// Default Mermaid configuration
const createDefaultMermaidConfig = (): MermaidConfig => ({
  theme: 'default',
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
  primaryColor: '#3B82F6',
  primaryTextColor: '#FFFFFF',
  primaryBorderColor: '#1E40AF',
  lineColor: '#6B7280',
  secondaryColor: '#10B981',
  tertiaryColor: '#F59E0B',
  background: '#FFFFFF',
  mainBkg: '#F3F4F6',
  secondBkg: '#E5E7EB',
  tertiaryBkg: '#D1D5DB',
  flowchart: {
    diagramPadding: 8,
    htmlLabels: true,
    nodeSpacing: 50,
    rankSpacing: 50,
    curve: 'basis',
    padding: 15,
    useMaxWidth: true,
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
    mirrorActors: true,
    bottomMarginAdj: 1,
    useMaxWidth: true,
    rightAngles: false,
  },
  gantt: {
    titleTopMargin: 25,
    barHeight: 20,
    barGap: 4,
    topPadding: 50,
    leftPadding: 75,
    gridLineStartPadding: 35,
    fontSize: 11,
    fontFamily: 'Arial, sans-serif',
    numberSectionStyles: 4,
    axisFormat: '%Y-%m-%d',
    topAxis: false,
    displayMode: 'standard',
  },
  journey: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    leftMargin: 150,
    width: 150,
    height: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
    bottomMarginAdj: 1,
    useMaxWidth: true,
    rightAngles: false,
  },
  pie: {
    textPosition: 0.75,
    useMaxWidth: true,
  },
  gitgraph: {
    diagramPadding: 8,
    nodeLabel: {
      width: 75,
      height: 100,
      x: -25,
      y: 0,
    },
    mainBranchName: 'main',
    showBranches: true,
    showCommitLabel: true,
    rotateCommitLabel: true,
  },
})

// Diagram Templates
const diagramTemplates: DiagramTemplate[] = [
  {
    id: 'simple-flowchart',
    name: 'Simple Flowchart',
    description: 'Basic flowchart with decision points',
    type: 'flowchart',
    category: 'Process',
    complexity: 'simple',
    code: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Fix it]
    D --> B
    C --> E[End]`,
    useCase: ['Process documentation', 'Decision trees', 'Workflow design'],
  },
  {
    id: 'sequence-diagram',
    name: 'Sequence Diagram',
    description: 'API interaction sequence',
    type: 'sequence',
    category: 'Communication',
    complexity: 'medium',
    code: `sequenceDiagram
    participant Client
    participant API
    participant Database

    Client->>API: Request data
    API->>Database: Query
    Database-->>API: Results
    API-->>Client: Response`,
    useCase: ['API documentation', 'System interactions', 'Communication flows'],
  },
  {
    id: 'class-diagram',
    name: 'Class Diagram',
    description: 'Object-oriented class structure',
    type: 'classDiagram',
    category: 'Structure',
    complexity: 'medium',
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
    useCase: ['Software design', 'Object modeling', 'Architecture documentation'],
  },
  {
    id: 'state-diagram',
    name: 'State Diagram',
    description: 'System state transitions',
    type: 'stateDiagram',
    category: 'Behavior',
    complexity: 'medium',
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Success : complete
    Processing --> Error : fail
    Success --> [*]
    Error --> Idle : retry
    Error --> [*] : abort`,
    useCase: ['System behavior', 'State machines', 'Process modeling'],
  },
  {
    id: 'gantt-chart',
    name: 'Gantt Chart',
    description: 'Project timeline and tasks',
    type: 'gantt',
    category: 'Planning',
    complexity: 'simple',
    code: `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Research           :done,    des1, 2023-01-01,2023-01-07
    Design             :done,    des2, 2023-01-08,2023-01-15
    section Development
    Frontend           :active,  dev1, 2023-01-16,2023-02-15
    Backend            :         dev2, 2023-01-20,2023-02-20
    section Testing
    Unit Tests         :         test1, after dev1, 10d
    Integration Tests  :         test2, after dev2, 5d`,
    useCase: ['Project management', 'Timeline planning', 'Task scheduling'],
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    description: 'Data distribution visualization',
    type: 'pie',
    category: 'Data',
    complexity: 'simple',
    code: `pie title Market Share
    "Company A" : 42.5
    "Company B" : 28.3
    "Company C" : 15.7
    "Others" : 13.5`,
    useCase: ['Data visualization', 'Market analysis', 'Statistics presentation'],
  },
  {
    id: 'user-journey',
    name: 'User Journey',
    description: 'User experience journey map',
    type: 'userJourney',
    category: 'Experience',
    complexity: 'medium',
    code: `journey
    title User Shopping Journey
    section Discovery
      Visit website     : 5: User
      Browse products   : 4: User
      Read reviews      : 3: User
    section Purchase
      Add to cart       : 4: User
      Checkout          : 2: User
      Payment           : 1: User
    section Post-purchase
      Receive product   : 5: User
      Leave review      : 3: User`,
    useCase: ['UX design', 'Customer experience', 'Service design'],
  },
  {
    id: 'git-graph',
    name: 'Git Graph',
    description: 'Git branching and merging',
    type: 'gitgraph',
    category: 'Development',
    complexity: 'medium',
    code: `gitgraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature A"
    commit id: "Feature B"
    checkout main
    merge develop
    commit id: "Release v1.0"
    branch hotfix
    checkout hotfix
    commit id: "Bug fix"
    checkout main
    merge hotfix`,
    useCase: ['Git workflow', 'Version control', 'Development process'],
  },
  {
    id: 'er-diagram',
    name: 'Entity Relationship',
    description: 'Database entity relationships',
    type: 'entityRelationship',
    category: 'Database',
    complexity: 'complex',
    code: `erDiagram
    CUSTOMER {
        string customer_id PK
        string name
        string email
        string phone
    }
    ORDER {
        string order_id PK
        string customer_id FK
        date order_date
        decimal total
    }
    PRODUCT {
        string product_id PK
        string name
        decimal price
        int stock
    }
    ORDER_ITEM {
        string order_id FK
        string product_id FK
        int quantity
        decimal price
    }
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"`,
    useCase: ['Database design', 'Data modeling', 'System architecture'],
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    description: 'Hierarchical concept map',
    type: 'mindmap',
    category: 'Brainstorming',
    complexity: 'simple',
    code: `mindmap
  root((Project Planning))
    Goals
      Increase Sales
      Improve Quality
      Reduce Costs
    Resources
      Team
        Developers
        Designers
        Testers
      Budget
        Development
        Marketing
        Operations
    Timeline
      Phase 1
      Phase 2
      Phase 3`,
    useCase: ['Brainstorming', 'Concept mapping', 'Knowledge organization'],
  },
]

// Custom hooks
const useMermaidDiagrams = () => {
  const [diagrams, setDiagrams] = useState<MermaidDiagram[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const createDiagram = useCallback(async (code: string, config: MermaidConfig): Promise<MermaidDiagram> => {
    setIsProcessing(true)
    try {
      const diagram = await renderMermaidDiagram(code, config)
      setDiagrams((prev) => [diagram, ...prev.slice(0, 99)]) // Keep last 100 diagrams
      return diagram
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const clearDiagrams = useCallback(() => {
    setDiagrams([])
  }, [])

  const removeDiagram = useCallback((id: string) => {
    setDiagrams((prev) => prev.filter((diagram) => diagram.id !== id))
  }, [])

  return {
    diagrams,
    isProcessing,
    createDiagram,
    clearDiagrams,
    removeDiagram,
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
const useMermaidExport = () => {
  const exportDiagram = useCallback((diagram: MermaidDiagram, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'svg':
        content = diagram.svg
        mimeType = 'image/svg+xml'
        extension = '.svg'
        break
      case 'markdown':
        content = diagram.markdown
        mimeType = 'text/markdown'
        extension = '.md'
        break
      case 'html':
        content = generateHTMLFromDiagram(diagram)
        mimeType = 'text/html'
        extension = '.html'
        break
      case 'json':
        content = JSON.stringify(diagram, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      default:
        content = diagram.code
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `mermaid-diagram-${diagram.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportDiagram }
}

// Helper function for HTML export
const generateHTMLFromDiagram = (diagram: MermaidDiagram): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${diagram.name}</title>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .diagram {
      text-align: center;
      margin: 20px 0;
    }
    .metadata {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .code {
      background: #f1f3f4;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      white-space: pre-wrap;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${diagram.name}</h1>
      <p>Generated on: ${diagram.timestamp.toLocaleString()}</p>
      <p>Type: ${diagram.type}</p>
    </div>

    <div class="diagram">
      ${diagram.svg}
    </div>

    <div class="metadata">
      <h3>Diagram Metadata</h3>
      <ul>
        <li>Nodes: ${diagram.metadata.nodeCount}</li>
        <li>Edges: ${diagram.metadata.edgeCount}</li>
        <li>Complexity: ${diagram.metadata.complexity}</li>
        <li>Render Time: ${diagram.metadata.renderTime.toFixed(2)}ms</li>
        <li>Code Size: ${formatFileSize(diagram.metadata.codeSize)}</li>
        <li>SVG Size: ${formatFileSize(diagram.metadata.svgSize)}</li>
      </ul>
    </div>

    <div class="code">
      <h3>Mermaid Code</h3>
      ${diagram.code}
    </div>
  </div>
</body>
</html>`
}

/**
 * Enhanced Markdown Mermaid & Diagram Tool
 * Features: Advanced Mermaid diagram creation, multiple diagram types, interactive editing, and comprehensive diagram management
 */
const MarkdownMermaidCore = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'templates' | 'settings'>('editor')
  const [diagramCode, setDiagramCode] = useState('')
  const [currentDiagram, setCurrentDiagram] = useState<MermaidDiagram | null>(null)
  const [config, setConfig] = useState<MermaidConfig>(createDefaultMermaidConfig())
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const { diagrams, isProcessing, createDiagram, clearDiagrams, removeDiagram } = useMermaidDiagrams()
  const { exportDiagram } = useMermaidExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = diagramTemplates.find((t) => t.id === templateId)
    if (template) {
      setDiagramCode(template.code)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Render diagram
  const handleRender = useCallback(async () => {
    if (!diagramCode.trim()) {
      toast.error('Please enter diagram code')
      return
    }

    const validation = validateMermaidCode(diagramCode)
    if (!validation.isValid) {
      toast.error(`Diagram error: ${validation.errors[0]?.message}`)
      return
    }

    try {
      const diagram = await createDiagram(diagramCode, config)
      setCurrentDiagram(diagram)
      toast.success('Diagram rendered successfully')
    } catch (error) {
      toast.error('Failed to render diagram')
      console.error(error)
    }
  }, [diagramCode, config, createDiagram])

  // Auto-render when code changes (debounced)
  useEffect(() => {
    if (diagramCode.trim()) {
      const timer = setTimeout(() => {
        handleRender()
      }, 1000)

      return () => clearTimeout(timer)
    } else {
      setCurrentDiagram(null)
    }
  }, [diagramCode, config, handleRender])

  // Extract Mermaid code from markdown
  const extractMermaidCode = useCallback((markdown: string): string => {
    const match = markdown.match(/```mermaid\n([\s\S]*?)\n```/)
    return match ? match[1].trim() : markdown.trim()
  }, [])

  // Handle markdown input
  const handleMarkdownInput = useCallback(
    (input: string) => {
      const extractedCode = extractMermaidCode(input)
      setDiagramCode(extractedCode)
    },
    [extractMermaidCode]
  )

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
              <ChartArea className="h-5 w-5" />
              Markdown Mermaid & Diagram Tool
            </CardTitle>
            <CardDescription>
              Advanced Mermaid diagram creation and editing tool with multiple diagram types, interactive editing, and
              comprehensive diagram management. Create flowcharts, sequence diagrams, class diagrams, and more with
              real-time preview and professional export options. Use keyboard navigation: Tab to move between controls,
              Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'editor' | 'history' | 'templates' | 'settings')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Diagram Editor Tab */}
          <TabsContent value="editor" className="space-y-4">
            {/* View Mode Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  View Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setViewMode('split')}
                    variant={viewMode === 'split' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Split className="mr-2 h-4 w-4" />
                    Split
                  </Button>
                  <Button
                    onClick={() => setViewMode('editor')}
                    variant={viewMode === 'editor' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Editor Only
                  </Button>
                  <Button
                    onClick={() => setViewMode('preview')}
                    variant={viewMode === 'preview' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Only
                  </Button>
                  <Button
                    onClick={() => setViewMode('fullscreen')}
                    variant={viewMode === 'fullscreen' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fullscreen
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className={`grid gap-4 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Code Editor */}
              {(viewMode === 'split' || viewMode === 'editor') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Diagram Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="diagram-code" className="text-sm font-medium">
                        Mermaid Code (or Markdown with ```mermaid blocks)
                      </Label>
                      <Textarea
                        id="diagram-code"
                        value={diagramCode}
                        onChange={(e) => {
                          const input = e.target.value
                          if (input.includes('```mermaid')) {
                            handleMarkdownInput(input)
                          } else {
                            setDiagramCode(input)
                          }
                        }}
                        placeholder="Enter your Mermaid diagram code here..."
                        className="mt-2 font-mono text-xs"
                        rows={viewMode === 'editor' ? 20 : 12}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleRender} disabled={isProcessing || !diagramCode.trim()} className="flex-1">
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        {isProcessing ? 'Rendering...' : 'Render Diagram'}
                      </Button>
                      <Button
                        onClick={() => {
                          setDiagramCode('')
                          setCurrentDiagram(null)
                        }}
                        variant="outline"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    </div>

                    {/* Quick Templates */}
                    <div className="space-y-2 border-t pt-4">
                      <Label className="text-sm font-medium">Quick Templates</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {diagramTemplates.slice(0, 4).map((template) => (
                          <Button
                            key={template.id}
                            onClick={() => applyTemplate(template.id)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Diagram Preview */}
              {(viewMode === 'split' || viewMode === 'preview' || viewMode === 'fullscreen') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Diagram Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentDiagram ? (
                      <div className="space-y-4">
                        {/* Diagram Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{currentDiagram.metadata.nodeCount}</div>
                            <div className="text-xs text-muted-foreground">Nodes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{currentDiagram.metadata.edgeCount}</div>
                            <div className="text-xs text-muted-foreground">Edges</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                              {currentDiagram.metadata.complexity}
                            </div>
                            <div className="text-xs text-muted-foreground">Complexity</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {currentDiagram.metadata.renderTime.toFixed(1)}ms
                            </div>
                            <div className="text-xs text-muted-foreground">Render Time</div>
                          </div>
                        </div>

                        {/* Diagram Display */}
                        <div className="border rounded-lg p-4 bg-white overflow-auto max-h-96">
                          <div
                            dangerouslySetInnerHTML={{ __html: currentDiagram.svg }}
                            className="flex justify-center"
                          />
                        </div>

                        {/* Export Options */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button onClick={() => exportDiagram(currentDiagram, 'svg')} variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            SVG
                          </Button>
                          <Button onClick={() => exportDiagram(currentDiagram, 'html')} variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            HTML
                          </Button>
                          <Button onClick={() => exportDiagram(currentDiagram, 'markdown')} variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Markdown
                          </Button>
                          <Button
                            onClick={() => copyToClipboard(currentDiagram.code, 'Diagram Code')}
                            variant="outline"
                            size="sm"
                          >
                            {copiedText === 'Diagram Code' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ChartArea className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Diagram</h3>
                        <p className="text-muted-foreground">Enter Mermaid code to see the diagram preview</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagram History</CardTitle>
                <CardDescription>View and manage your Mermaid diagram history</CardDescription>
              </CardHeader>
              <CardContent>
                {diagrams.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {diagrams.length} diagram{diagrams.length !== 1 ? 's' : ''} in history
                      </span>
                      <Button onClick={clearDiagrams} variant="outline" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear History
                      </Button>
                    </div>

                    {diagrams.map((diagram) => (
                      <div key={diagram.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {diagram.name} - {diagram.timestamp.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">{diagram.type}</span>
                            <Button size="sm" variant="ghost" onClick={() => removeDiagram(diagram.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-4 text-xs text-center">
                            <div>
                              <div className="font-medium">{diagram.metadata.nodeCount}</div>
                              <div className="text-muted-foreground">Nodes</div>
                            </div>
                            <div>
                              <div className="font-medium">{diagram.metadata.edgeCount}</div>
                              <div className="text-muted-foreground">Edges</div>
                            </div>
                            <div>
                              <div className="font-medium">{diagram.metadata.complexity}</div>
                              <div className="text-muted-foreground">Complexity</div>
                            </div>
                            <div>
                              <div className="font-medium">{diagram.metadata.renderTime.toFixed(1)}ms</div>
                              <div className="text-muted-foreground">Render Time</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDiagramCode(diagram.code)
                              setCurrentDiagram(diagram)
                              setActiveTab('editor')
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => exportDiagram(diagram, 'svg')}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(diagram.code, 'Diagram Code')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History</h3>
                    <p className="text-muted-foreground">Create some Mermaid diagrams to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagram Templates</CardTitle>
                <CardDescription>Pre-built Mermaid diagram templates for different use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagramTemplates.map((template) => (
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                template.complexity === 'simple'
                                  ? 'bg-green-100 text-green-800'
                                  : template.complexity === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {template.complexity}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div>
                          <div className="text-xs font-medium mb-1">Use Cases:</div>
                          <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Type:</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {template.type.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagram Settings</CardTitle>
                <CardDescription>Configure Mermaid diagram appearance and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Theme & Appearance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="theme" className="text-sm">
                        Theme
                      </Label>
                      <Select
                        value={config.theme}
                        onValueChange={(value) => setConfig((prev) => ({ ...prev, theme: value as any }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="forest">Forest</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="font-family" className="text-sm">
                        Font Family
                      </Label>
                      <Input
                        id="font-family"
                        value={config.fontFamily}
                        onChange={(e) => setConfig((prev) => ({ ...prev, fontFamily: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="font-size" className="text-sm">
                        Font Size
                      </Label>
                      <Input
                        id="font-size"
                        type="number"
                        min="8"
                        max="24"
                        value={config.fontSize}
                        onChange={(e) => setConfig((prev) => ({ ...prev, fontSize: parseInt(e.target.value) || 16 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="primary-color" className="text-sm">
                        Primary Color
                      </Label>
                      <Input
                        id="primary-color"
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Flowchart Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Flowchart Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="node-spacing" className="text-sm">
                        Node Spacing
                      </Label>
                      <Input
                        id="node-spacing"
                        type="number"
                        min="10"
                        max="200"
                        value={config.flowchart.nodeSpacing}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            flowchart: {
                              ...prev.flowchart,
                              nodeSpacing: parseInt(e.target.value) || 50,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rank-spacing" className="text-sm">
                        Rank Spacing
                      </Label>
                      <Input
                        id="rank-spacing"
                        type="number"
                        min="10"
                        max="200"
                        value={config.flowchart.rankSpacing}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            flowchart: {
                              ...prev.flowchart,
                              rankSpacing: parseInt(e.target.value) || 50,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="curve-type" className="text-sm">
                        Curve Type
                      </Label>
                      <Select
                        value={config.flowchart.curve}
                        onValueChange={(value) =>
                          setConfig((prev) => ({
                            ...prev,
                            flowchart: {
                              ...prev.flowchart,
                              curve: value as any,
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basis">Basis</SelectItem>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="cardinal">Cardinal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <input
                        id="html-labels"
                        type="checkbox"
                        checked={config.flowchart.htmlLabels}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            flowchart: {
                              ...prev.flowchart,
                              htmlLabels: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-input"
                      />
                      <Label htmlFor="html-labels" className="text-sm">
                        HTML Labels
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Reset Settings */}
                <div className="pt-4 border-t">
                  <Button onClick={() => setConfig(createDefaultMermaidConfig())} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
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
const MarkdownMermaid = () => {
  return <MarkdownMermaidCore />
}

export default MarkdownMermaid
