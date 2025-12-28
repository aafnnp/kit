// ==================== Quadratic Solver Types ====================

/**
 * Equation Type type
 */
export type equationType = "quadratic" | "linear" | "cubic" | "quartic" | "polynomial" | "rational" | "exponential" | "logarithmic" | "trigonometric"

/**
 * Solution Type type
 */
export type solutionType = "real" | "complex" | "rational" | "irrational" | "repeated"

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml" | "yaml" | "latex" | "mathml"

/**
 * Complex Number type
 */
export interface complexNumber {
  real: number,
  imaginary: number,
  magnitude: number,
  argument: number,
}

/**
 * Solution type
 */
export interface solution {
  type: solutionType,
  value: number | complexNumber,
  multiplicity: number,
  isReal: boolean,
  isRational: boolean
  approximation?: string
}

/**
 * Point 2D type
 */
export interface point2D {
  x: number,
  y: number,
}

/**
 * Interval type
 */
export interface interval {
  min: number | "-∞",
  max: number | "∞",
  minInclusive: boolean,
  maxInclusive: boolean,
}

/**
 * Extremum type
 */
export interface extremum {
  type: "minimum"| "maximum",
  point: point2D,
  isGlobal: boolean,
}

/**
 * Asymptote type
 */
export interface asymptote {
  type: "vertical"| "horizontal" | "oblique",
  equation: string
  value?: number
}

/**
 * Equation type
 */
export interface equation {
  type: equationType,
  coefficients: number[],
  variables: string[],
  expression: string,
  standardForm: string,
}

/**
 * Solution Metadata type
 */
export interface solutionMetadata {
  solutionTime: number
  discriminant?: number
  numberOfSolutions: number,
  solutionTypes: solutionType[],
  complexity: number,
  numericalStability: number,
}

/**
 * Equation Analysis type
 */
export interface equationAnalysis {
  vertex?: point2D
  axisOfSymmetry?: number
  yIntercept?: number
  xIntercepts?: number[]
  domain: interval,
  range: interval,
  concavity: "up"| "down" | "none",
  extrema: extremum[],
  inflectionPoints: point2D[],
  asymptotes: asymptote[],
}

/**
 * Equation Solution type
 */
export interface equationSolution {
  id: string,
  equation: equation,
  solutions: solution[],
  metadata: solutionMetadata,
  analysis: equationAnalysis,
  timestamp: Date,
}

/**
 * Graph Settings type
 */
export interface graphSettings {
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  gridSize: number,
  showGrid: boolean,
  showAxes: boolean,
  showLabels: boolean,
  resolution: number,
}

/**
 * Equation Error type
 */
export interface equationError {
  message: string,
  type: "coefficient"| "structure" | "numerical" | "mathematical",
  severity: "error"| "warning" | "info"
  coefficient?: string
}

/**
 * Equation Validation type
 */
export interface equationValidation {
  isValid: boolean,
  errors: equationError[],
  warnings: string[],
  suggestions: string[],
  qualityScore: number,
}

/**
 * Equation Template type
 */
export interface equationTemplate {
  id: string,
  name: string,
  description: string,
  type: equationType,
  category: string,
  coefficients: number[],
  expectedSolutions: number,
  useCase: string[],
  difficulty: "simple"| "medium" | "complex",
}

// ==================== Type Exports ====================

export type EquationType = equationType
export type SolutionType = solutionType
export type ExportFormat = exportFormat
export type ComplexNumber = complexNumber
export type Solution = solution
export type Point2D = point2D
export type Interval = interval
export type Extremum = extremum
export type Asymptote = asymptote
export type Equation = equation
export type SolutionMetadata = solutionMetadata
export type EquationAnalysis = equationAnalysis
export type EquationSolution = equationSolution
export type GraphSettings = graphSettings
export type EquationError = equationError
export type EquationValidation = equationValidation
export type EquationTemplate = equationTemplate
