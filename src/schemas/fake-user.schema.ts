import { z } from "zod"

// ==================== Fake User Schemas ====================

/**
 * Export Format schema
 */
export const exportFormatSchema = z.enum(["json", "csv", "xml", "sql", "yaml"])

/**
 * Gender schema
 */
export const genderSchema = z.enum(["male", "female", "other", "random"])

/**
 * Marital Status schema
 */
export const maritalStatusSchema = z.enum(["single", "married", "divorced", "widowed"])

/**
 * Privacy Level schema
 */
export const privacyLevelSchema = z.enum(["public", "private", "friends"])

/**
 * Theme schema
 */
export const themeSchema = z.enum(["light", "dark", "auto"])

/**
 * Account Status schema
 */
export const accountStatusSchema = z.enum(["active", "inactive", "suspended"])

/**
 * Custom Field Type schema
 */
export const customFieldTypeSchema = z.enum(["text", "number", "email", "phone", "date", "boolean", "select"])

/**
 * Custom Field schema
 */
export const customFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: customFieldTypeSchema,
  options: z.array(z.string()).optional(),
  required: z.boolean(),
})

/**
 * Personal Info schema
 */
export const personalInfoSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.date(),
  age: z.number(),
  nationality: z.string(),
  ethnicity: z.string(),
  maritalStatus: maritalStatusSchema,
  bloodType: z.string(),
  height: z.number(),
  weight: z.number(),
  eyeColor: z.string(),
  hairColor: z.string(),
})

/**
 * Contact Info schema
 */
export const contactInfoSchema = z.object({
  email: z.string(),
  phone: z.string(),
  alternatePhone: z.string().optional(),
  website: z.string().optional(),
  socialMedia: z.object({
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }),
})

/**
 * Address Info schema
 */
export const addressInfoSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zipCode: z.string(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  timezone: z.string(),
})

/**
 * Work Info schema
 */
export const workInfoSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  department: z.string(),
  industry: z.string(),
  experience: z.number(),
  salary: z.number(),
  skills: z.array(z.string()),
  education: z.object({
    degree: z.string(),
    major: z.string(),
    university: z.string(),
    graduationYear: z.number(),
  }),
})

/**
 * Financial Info schema
 */
export const financialInfoSchema = z.object({
  creditCardNumber: z.string(),
  creditCardType: z.string(),
  bankAccount: z.string(),
  routingNumber: z.string(),
  currency: z.string(),
  monthlyIncome: z.number(),
  creditScore: z.number(),
})

/**
 * Social Info schema
 */
export const socialInfoSchema = z.object({
  bio: z.string(),
  interests: z.array(z.string()),
  hobbies: z.array(z.string()),
  languages: z.array(z.string()),
  personalityType: z.string(),
  favoriteColor: z.string(),
  favoriteFood: z.string(),
  favoriteMovie: z.string(),
  favoriteBook: z.string(),
})

/**
 * User Preferences schema
 */
export const userPreferencesSchema = z.object({
  theme: themeSchema,
  language: z.string(),
  timezone: z.string(),
  notifications: z.boolean(),
  privacy: privacyLevelSchema,
})

/**
 * User Metadata schema
 */
export const userMetadataSchema = z.object({
  userAgent: z.string(),
  ipAddress: z.string(),
  registrationDate: z.date(),
  lastLogin: z.date(),
  accountStatus: accountStatusSchema,
  verificationStatus: z.boolean(),
  profileCompleteness: z.number(),
})

/**
 * Generation Settings schema
 */
export const generationSettingsSchema = z.object({
  locale: z.string(),
  gender: genderSchema.optional(),
  ageRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  includeFinancial: z.boolean(),
  includeSocial: z.boolean(),
  includeWork: z.boolean(),
  includeAddress: z.boolean(),
  realData: z.boolean(),
  customFields: z.array(customFieldSchema),
})

/**
 * Fake User schema
 */
export const fakeUserSchema = z.object({
  id: z.string(),
  personalInfo: personalInfoSchema,
  contactInfo: contactInfoSchema,
  addressInfo: addressInfoSchema,
  workInfo: workInfoSchema,
  financialInfo: financialInfoSchema,
  socialInfo: socialInfoSchema,
  preferences: userPreferencesSchema,
  metadata: userMetadataSchema,
  createdAt: z.date(),
})

/**
 * Batch Settings schema
 */
export const batchSettingsSchema = z.object({
  baseSettings: generationSettingsSchema,
  count: z.number(),
  namingPattern: z.string(),
  exportFormat: exportFormatSchema,
  includeAnalysis: z.boolean(),
  deduplication: z.boolean(),
})

/**
 * Batch Statistics schema
 */
export const batchStatisticsSchema = z.object({
  totalGenerated: z.number(),
  successfulGenerated: z.number(),
  failedGenerated: z.number(),
  averageAge: z.number(),
  genderDistribution: z.record(z.string(), z.number()),
  nationalityDistribution: z.record(z.string(), z.number()),
  totalProcessingTime: z.number(),
  averageProcessingTime: z.number(),
})

/**
 * User Batch schema
 */
export const userBatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  users: z.array(fakeUserSchema),
  settings: batchSettingsSchema,
  status: z.enum(["pending", "processing", "completed", "failed"]),
  progress: z.number(),
  statistics: batchStatisticsSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
})

/**
 * User Template schema
 */
export const userTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  settings: generationSettingsSchema.partial(),
  useCase: z.array(z.string()),
  examples: z.array(z.string()),
  preview: fakeUserSchema.partial().optional(),
})

// ==================== Type Exports ====================

export type ExportFormat = z.infer<typeof exportFormatSchema>
export type Gender = z.infer<typeof genderSchema>
export type MaritalStatus = z.infer<typeof maritalStatusSchema>
export type PrivacyLevel = z.infer<typeof privacyLevelSchema>
export type Theme = z.infer<typeof themeSchema>
export type AccountStatus = z.infer<typeof accountStatusSchema>
export type CustomFieldType = z.infer<typeof customFieldTypeSchema>
export type CustomField = z.infer<typeof customFieldSchema>
export type PersonalInfo = z.infer<typeof personalInfoSchema>
export type ContactInfo = z.infer<typeof contactInfoSchema>
export type AddressInfo = z.infer<typeof addressInfoSchema>
export type WorkInfo = z.infer<typeof workInfoSchema>
export type FinancialInfo = z.infer<typeof financialInfoSchema>
export type SocialInfo = z.infer<typeof socialInfoSchema>
export type UserPreferences = z.infer<typeof userPreferencesSchema>
export type UserMetadata = z.infer<typeof userMetadataSchema>
export type GenerationSettings = z.infer<typeof generationSettingsSchema>
export type FakeUser = z.infer<typeof fakeUserSchema>
export type BatchSettings = z.infer<typeof batchSettingsSchema>
export type BatchStatistics = z.infer<typeof batchStatisticsSchema>
export type UserBatch = z.infer<typeof userBatchSchema>
export type UserTemplate = z.infer<typeof userTemplateSchema>
