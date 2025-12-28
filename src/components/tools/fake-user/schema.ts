// ==================== Fake User Types ====================

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "xml" | "sql" | "yaml"

/**
 * Gender type
 */
export type gender = "male" | "female" | "other" | "random"

/**
 * Marital Status type
 */
export type maritalStatus = "single" | "married" | "divorced" | "widowed"

/**
 * Privacy Level type
 */
export type privacyLevel = "public" | "private" | "friends"

/**
 * Theme type
 */
export type theme = "light" | "dark" | "auto"

/**
 * Account Status type
 */
export type accountStatus = "active" | "inactive" | "suspended"

/**
 * Custom Field Type type
 */
export type customFieldType = "text" | number | "email" | "phone" | "date" | boolean | "select"

/**
 * Custom Field type
 */
export interface customField {
  id: string,
  name: string,
  type: customFieldType
  options?: string[]
  required: boolean,
}

/**
 * Personal Info type
 */
export interface personalInfo {
  firstName: string,
  lastName: string,
  fullName: string,
  gender: "male"| "female" | "other" | "random",
  dateOfBirth: Date,
  age: number,
  nationality: string,
  ethnicity: string,
  maritalStatus: maritalStatus,
  bloodType: string,
  height: number,
  weight: number,
  eyeColor: string,
  hairColor: string,
}

/**
 * Contact Info type
 */
export interface contactInfo {
  email: string,
  phone: string
  alternatePhone?: string
  website?: string
  socialMedia: {
    twitter?: string
    facebook?: string
    instagram?: string
  linkedin?: string
  github?: string
}
}
/**
 * Address Info type
 */
export interface addressInfo {
  street: string,
  city: string,
  state: string,
  country: string,
  zipCode: string,
  coordinates: {
    latitude: number,
    longitude: number,
  },
  timezone: string,
}
/**
 * Work Info type
 */
export interface workInfo {
  jobTitle: string,
  company: string,
  department: string,
  industry: string,
  experience: number,
  salary: number,
  skills: string[],
  education: {
    degree: string,
  major: string,
    university: string,
  graduationYear: number,
}
}
/**
 * Financial Info type
 */
export interface financialInfo {
  creditCardNumber: string,
  creditCardType: string,
  bankAccount: string,
  routingNumber: string,
  currency: string,
  monthlyIncome: number,
  creditScore: number,
}

/**
 * Social Info type
 */
export interface socialInfo {
  bio: string,
  interests: string[],
  hobbies: string[],
  languages: string[],
  personalityType: string,
  favoriteColor: string,
  favoriteFood: string,
  favoriteMovie: string,
  favoriteBook: string,
}

/**
 * User Preferences type
 */
export interface userPreferences {
  theme: theme,
  language: string,
  timezone: string,
  notifications: boolean,
  privacy: privacyLevel,
}

/**
 * User Metadata type
 */
export interface userMetadata {
  userAgent: string,
  ipAddress: string,
  registrationDate: Date,
  lastLogin: Date,
  accountStatus: accountStatus,
  verificationStatus: boolean,
  profileCompleteness: number,
}

/**
 * Generation Settings type
 */
export interface generationSettings {
  locale: string
  gender?: gender
  ageRange: {
    min: number,
    max: number,
  },
  includeFinancial: boolean,
  includeSocial: boolean,
  includeWork: boolean,
  includeAddress: boolean,
  realData: boolean,
  customFields: customField[],
}
/**
 * Fake User type
 */
export interface fakeUser {
  id: string,
  personalInfo: personalInfo,
  contactInfo: contactInfo,
  addressInfo: addressInfo,
  workInfo: workInfo,
  financialInfo: financialInfo,
  socialInfo: socialInfo,
  preferences: userPreferences,
  metadata: userMetadata,
  createdAt: Date,
}

/**
 * Batch Settings type
 */
export interface batchSettings {
  baseSettings: generationSettings,
  count: number,
  namingPattern: string,
  exportFormat: exportFormat,
  includeAnalysis: boolean,
  deduplication: boolean,
}

/**
 * Batch Statistics type
 */
export interface batchStatistics {
  totalGenerated: number,
  successfulGenerated: number,
  failedGenerated: number,
  averageAge: number,
  genderDistribution: Record<string, number>,
  nationalityDistribution: Record<string, number>,
  totalProcessingTime: number,
  averageProcessingTime: number,
}

/**
 * User Batch type
 */
export interface userBatch {
  id: string,
  name: string,
  users: fakeUser[],
  settings: batchSettings,
  status: "pending"| "processing" | "completed" | "failed",
  progress: number,
  statistics: batchStatistics,
  createdAt: Date
  completedAt?: Date
}

/**
 * User Template type
 */
export interface userTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  settings: generationSettings,
  useCase: string[],
  examples: string[]
  preview?: Partial<fakeUser>
}

// ==================== Type Exports ====================

export type ExportFormat = exportFormat
export type Gender = gender
export type MaritalStatus = maritalStatus
export type PrivacyLevel = privacyLevel
export type Theme = theme
export type AccountStatus = accountStatus
export type CustomFieldType = customFieldType
export type CustomField = customField
export type PersonalInfo = personalInfo
export type ContactInfo = contactInfo
export type AddressInfo = addressInfo
export type WorkInfo = workInfo
export type FinancialInfo = financialInfo
export type SocialInfo = socialInfo
export type UserPreferences = userPreferences
export type UserMetadata = userMetadata
export type GenerationSettings = generationSettings
export type FakeUser = fakeUser
export type BatchSettings = batchSettings
export type BatchStatistics = batchStatistics
export type UserBatch = userBatch
export type UserTemplate = userTemplate
