import { z } from "zod"

// ==================== Quadratic Solver Schemas ====================

/**
 * Equation Type schema
 */
export const equationTypeSchema = z.enum([
  "quadratic",
  "linear",
  "cubic",
  "quartic",
  "polynomial",
  "rational",
  "exponential",
  "logarithmic",
  "trigonometric",
])

/**
 * Solution Type schema
 */
export const solutionTypeSchema = z.enum(["real", "complex", "rational", "irrational", "repeated"])

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "txt", "xml", "yaml", "latex", "mathml"])

/**
 * Complex Number schema
 */
export const complexNumberSchema = z.object({
  real: z.number(),
  imaginary: z.number(),
  magnitude: z.number(),
  argument: z.number(),
})

/**
 * Solution schema
 */
export const solutionSchema = z.object({
  type: solutionTypeSchema,
  value: z.union([z.number(), complexNumberSchema]),
  multiplicity: z.number(),
  isReal: z.boolean(),
  isRational: z.boolean(),
  approximation: z.string().optional(),
})

/**
 * Point 2D schema
 */
export const point2DSchema = z.object({
  x: z.number(),
  y: z.number(),
})

/**
 * Interval schema
 */
export const intervalSchema = z.object({
  min: z.union([z.number(), z.literal("-∞")]),
  max: z.union([z.number(), z.literal("∞")]),
  minInclusive: z.boolean(),
  maxInclusive: z.boolean(),
})

/**
 * Extremum schema
 */
export const extremumSchema = z.object({
  type: z.enum(["minimum", "maximum"]),
  point: point2DSchema,
  isGlobal: z.boolean(),
})

/**
 * Asymptote schema
 */
export const asymptoteSchema = z.object({
  type: z.enum(["vertical", "horizontal", "oblique"]),
  equation: z.string(),
  value: z.number().optional(),
})

/**
 * Equation schema
 */
export const equationSchema = z.object({
  type: equationTypeSchema,
  coefficients: z.array(z.number()),
  variables: z.array(z.string()),
  expression: z.string(),
  standardForm: z.string(),
})

/**
 * Solution Metadata schema
 */
export const solutionMetadataSchema = z.object({
  solutionTime: z.number(),
  discriminant: z.number().optional(),
  numberOfSolutions: z.number(),
  solutionTypes: z.array(solutionTypeSchema),
  complexity: z.number(),
  numericalStability: z.number(),
})

/**
 * Equation Analysis schema
 */
export const equationAnalysisSchema = z.object({
  vertex: point2DSchema.optional(),
  axisOfSymmetry: z.number().optional(),
  yIntercept: z.number().optional(),
  xIntercepts: z.array(z.number()).optional(),
  domain: intervalSchema,
  range: intervalSchema,
  concavity: z.enum(["up", "down", "none"]),
  extrema: z.array(extremumSchema),
  inflectionPoints: z.array(point2DSchema),
  asymptotes: z.array(asymptoteSchema),
})

/**
 * Equation Solution schema
 */
export const equationSolutionSchema = z.object({
  id: z.string(),
  equation: equationSchema,
  solutions: z.array(solutionSchema),
  metadata: solutionMetadataSchema,
  analysis: equationAnalysisSchema,
  timestamp: z.date(),
})

/**
 * Graph Settings schema
 */
export const graphSettingsSchema = z.object({
  xMin: z.number(),
  xMax: z.number(),
  yMin: z.number(),
  yMax: z.number(),
  gridSize: z.number(),
  showGrid: z.boolean(),
  showAxes: z.boolean(),
  showLabels: z.boolean(),
  resolution: z.number(),
})

/**
 * Equation Error schema
 */
export const equationErrorSchema = z.object({
  message: z.string(),
  type: z.enum(["coefficient", "structure", "numerical", "mathematical"]),
  severity: z.enum(["error", "warning", "info"]),
  coefficient: z.string().optional(),
})

/**
 * Equation Validation schema
 */
export const equationValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(equationErrorSchema),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
  qualityScore: z.number(),
})

/**
 * Equation Template schema
 */
export const equationTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: equationTypeSchema,
  category: z.string(),
  coefficients: z.array(z.number()),
  expectedSolutions: z.number(),
  useCase: z.array(z.string()),
  difficulty: z.enum(["simple", "medium", "complex"]),
})

// ==================== Type Exports ====================

export type EquationType = z.infer<typeof equationTypeSchema>
export type SolutionType = z.infer<typeof solutionTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ComplexNumber = z.infer<typeof complexNumberSchema>
export type Solution = z.infer<typeof solutionSchema>
export type Point2D = z.infer<typeof point2DSchema>
export type Interval = z.infer<typeof intervalSchema>
export type Extremum = z.infer<typeof extremumSchema>
export type Asymptote = z.infer<typeof asymptoteSchema>
export type Equation = z.infer<typeof equationSchema>
export type SolutionMetadata = z.infer<typeof solutionMetadataSchema>
export type EquationAnalysis = z.infer<typeof equationAnalysisSchema>
export type EquationSolution = z.infer<typeof equationSolutionSchema>
export type GraphSettings = z.infer<typeof graphSettingsSchema>
export type EquationError = z.infer<typeof equationErrorSchema>
export type EquationValidation = z.infer<typeof equationValidationSchema>
export type EquationTemplate = z.infer<typeof equationTemplateSchema>
