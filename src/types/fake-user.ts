// Fake User 相关类型声明
export interface FakeUser {
  id: string
  personalInfo: PersonalInfo
  contactInfo: ContactInfo
  addressInfo: AddressInfo
  workInfo: WorkInfo
  financialInfo: FinancialInfo
  socialInfo: SocialInfo
  preferences: UserPreferences
  metadata: UserMetadata
  createdAt: Date
}

export interface PersonalInfo {
  firstName: string
  lastName: string
  fullName: string
  gender: 'male' | 'female' | 'other'
  dateOfBirth: Date
  age: number
  nationality: string
  ethnicity: string
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
  bloodType: string
  height: number
  weight: number
  eyeColor: string
  hairColor: string
}

export interface ContactInfo {
  email: string
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

export interface AddressInfo {
  street: string
  city: string
  state: string
  country: string
  zipCode: string
  coordinates: {
    latitude: number
    longitude: number
  }
  timezone: string
}

export interface WorkInfo {
  jobTitle: string
  company: string
  department: string
  industry: string
  experience: number
  salary: number
  skills: string[]
  education: {
    degree: string
    major: string
    university: string
    graduationYear: number
  }
}

export interface FinancialInfo {
  creditCardNumber: string
  creditCardType: string
  bankAccount: string
  routingNumber: string
  currency: string
  monthlyIncome: number
  creditScore: number
}

export interface SocialInfo {
  bio: string
  interests: string[]
  hobbies: string[]
  languages: string[]
  personalityType: string
  favoriteColor: string
  favoriteFood: string
  favoriteMovie: string
  favoriteBook: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: boolean
  privacy: 'public' | 'private' | 'friends'
}

export interface UserMetadata {
  userAgent: string
  ipAddress: string
  registrationDate: Date
  lastLogin: Date
  accountStatus: 'active' | 'inactive' | 'suspended'
  verificationStatus: boolean
  profileCompleteness: number
}

export interface GenerationSettings {
  locale: string
  gender?: 'male' | 'female' | 'random'
  ageRange: { min: number; max: number }
  includeFinancial: boolean
  includeSocial: boolean
  includeWork: boolean
  includeAddress: boolean
  realData: boolean
  customFields: CustomField[]
}

export interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'boolean' | 'select'
  options?: string[]
  required: boolean
}

export interface UserBatch {
  id: string
  name: string
  users: FakeUser[]
  settings: BatchSettings
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  statistics: BatchStatistics
  createdAt: Date
  completedAt?: Date
}

export interface BatchSettings {
  baseSettings: GenerationSettings
  count: number
  namingPattern: string
  exportFormat: ExportFormat
  includeAnalysis: boolean
  deduplication: boolean
}

export interface BatchStatistics {
  totalGenerated: number
  successfulGenerated: number
  failedGenerated: number
  averageAge: number
  genderDistribution: Record<string, number>
  nationalityDistribution: Record<string, number>
  totalProcessingTime: number
  averageProcessingTime: number
}

export interface UserTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: Partial<GenerationSettings>
  useCase: string[]
  examples: string[]
  preview?: Partial<FakeUser>
}

export type ExportFormat = 'json' | 'csv' | 'xml' | 'sql' | 'yaml'
