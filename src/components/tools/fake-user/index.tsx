import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Layers,
  Mail,
  CreditCard,
  User,
  Home,
  Users,
  UserPlus,
  Briefcase,
  Heart,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  FakeUser,
  PersonalInfo,
  ContactInfo,
  AddressInfo,
  WorkInfo,
  FinancialInfo,
  SocialInfo,
  UserPreferences,
  UserMetadata,
  GenerationSettings,
  UserBatch,
  BatchSettings,
  BatchStatistics,
  UserTemplate,
  ExportFormat,
} from '@/types/fake-user'
// Utility functions

// Data sources for fake user generation
const firstNames = {
  male: [
    'James',
    'John',
    'Robert',
    'Michael',
    'William',
    'David',
    'Richard',
    'Joseph',
    'Thomas',
    'Christopher',
    'Charles',
    'Daniel',
    'Matthew',
    'Anthony',
    'Mark',
    'Donald',
    'Steven',
    'Paul',
    'Andrew',
    'Joshua',
  ],
  female: [
    'Mary',
    'Patricia',
    'Jennifer',
    'Linda',
    'Elizabeth',
    'Barbara',
    'Susan',
    'Jessica',
    'Sarah',
    'Karen',
    'Nancy',
    'Lisa',
    'Betty',
    'Helen',
    'Sandra',
    'Donna',
    'Carol',
    'Ruth',
    'Sharon',
    'Michelle',
  ],
}

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
]

const countries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Japan',
  'South Korea',
  'Singapore',
  'New Zealand',
  'Switzerland',
  'Austria',
  'Belgium',
  'Ireland',
]

const cities = {
  'United States': [
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Phoenix',
    'Philadelphia',
    'San Antonio',
    'San Diego',
    'Dallas',
    'San Jose',
  ],
  Canada: [
    'Toronto',
    'Montreal',
    'Vancouver',
    'Calgary',
    'Edmonton',
    'Ottawa',
    'Winnipeg',
    'Quebec City',
    'Hamilton',
    'Kitchener',
  ],
  'United Kingdom': [
    'London',
    'Birmingham',
    'Manchester',
    'Glasgow',
    'Liverpool',
    'Leeds',
    'Sheffield',
    'Edinburgh',
    'Bristol',
    'Cardiff',
  ],
  Australia: [
    'Sydney',
    'Melbourne',
    'Brisbane',
    'Perth',
    'Adelaide',
    'Gold Coast',
    'Newcastle',
    'Canberra',
    'Sunshine Coast',
    'Wollongong',
  ],
}

const jobTitles = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'Marketing Manager',
  'Sales Representative',
  'Accountant',
  'Teacher',
  'Nurse',
  'Doctor',
  'Lawyer',
  'Designer',
  'Consultant',
  'Analyst',
  'Developer',
  'Manager',
  'Director',
  'Coordinator',
  'Specialist',
  'Administrator',
  'Executive',
]

const companies = [
  'TechCorp',
  'DataSystems',
  'InnovateLab',
  'GlobalSoft',
  'NextGen Solutions',
  'Digital Dynamics',
  'Smart Industries',
  'Future Tech',
  'Advanced Systems',
  'Modern Solutions',
  'Elite Corp',
  'Prime Technologies',
  'Apex Industries',
  'Summit Solutions',
  'Peak Performance',
  'Excellence Group',
  'Premier Systems',
  'Superior Tech',
  'Ultimate Solutions',
  'Optimal Corp',
]

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Media',
  'Transportation',
  'Real Estate',
  'Energy',
  'Telecommunications',
  'Government',
  'Non-profit',
  'Entertainment',
  'Hospitality',
  'Agriculture',
  'Construction',
  'Automotive',
  'Aerospace',
]

const skills = [
  'JavaScript',
  'Python',
  'Java',
  'React',
  'Node.js',
  'SQL',
  'AWS',
  'Docker',
  'Kubernetes',
  'Git',
  'Agile',
  'Scrum',
  'Project Management',
  'Data Analysis',
  'Machine Learning',
  'UI/UX Design',
  'Marketing',
  'Sales',
  'Communication',
  'Leadership',
]

const interests = [
  'Reading',
  'Travel',
  'Photography',
  'Cooking',
  'Music',
  'Sports',
  'Gaming',
  'Art',
  'Technology',
  'Science',
  'History',
  'Movies',
  'Fitness',
  'Yoga',
  'Hiking',
  'Swimming',
  'Dancing',
  'Writing',
  'Gardening',
  'Volunteering',
]

const languages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Dutch',
  'Swedish',
  'Norwegian',
  'Danish',
  'Finnish',
  'Polish',
  'Turkish',
  'Greek',
]

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const eyeColors = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber']
const hairColors = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White']
const ethnicities = [
  'Caucasian',
  'African American',
  'Hispanic',
  'Asian',
  'Native American',
  'Pacific Islander',
  'Mixed',
  'Other',
]

// Fake user generation functions
const generateFakeUser = (settings: GenerationSettings): FakeUser => {
  const gender = settings.gender === 'random' ? (Math.random() > 0.5 ? 'male' : 'female') : settings.gender || 'male'
  const firstName = getRandomItem(firstNames[gender])
  const lastName = getRandomItem(lastNames)
  const age = getRandomNumber(settings.ageRange.min, settings.ageRange.max)
  const dateOfBirth = new Date()
  dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age)
  dateOfBirth.setMonth(Math.floor(Math.random() * 12))
  dateOfBirth.setDate(Math.floor(Math.random() * 28) + 1)

  const country = getRandomItem(countries)
  const cityList = cities[country as keyof typeof cities] || ['Unknown City']
  const city = getRandomItem(cityList)

  const personalInfo: PersonalInfo = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    gender,
    dateOfBirth,
    age,
    nationality: country,
    ethnicity: getRandomItem(ethnicities),
    maritalStatus: getRandomItem(['single', 'married', 'divorced', 'widowed']),
    bloodType: getRandomItem(bloodTypes),
    height: getRandomNumber(150, 200),
    weight: getRandomNumber(50, 120),
    eyeColor: getRandomItem(eyeColors),
    hairColor: getRandomItem(hairColors),
  }

  const contactInfo: ContactInfo = {
    email: generateEmail(firstName, lastName),
    phone: generatePhoneNumber(),
    alternatePhone: Math.random() > 0.7 ? generatePhoneNumber() : undefined,
    website: Math.random() > 0.8 ? `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.com` : undefined,
    socialMedia: {
      twitter: Math.random() > 0.6 ? `@${firstName.toLowerCase()}_${lastName.toLowerCase()}` : undefined,
      facebook: Math.random() > 0.7 ? `${firstName} ${lastName}` : undefined,
      instagram: Math.random() > 0.5 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}` : undefined,
      linkedin: Math.random() > 0.4 ? `${firstName.toLowerCase()}-${lastName.toLowerCase()}` : undefined,
      github: Math.random() > 0.8 ? `${firstName.toLowerCase()}${lastName.toLowerCase()}` : undefined,
    },
  }

  const addressInfo: AddressInfo = settings.includeAddress
    ? {
        street: `${getRandomNumber(1, 9999)} ${getRandomItem(['Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Park', 'First', 'Second', 'Third'])} ${getRandomItem(['St', 'Ave', 'Rd', 'Blvd', 'Dr', 'Ln', 'Way', 'Ct'])}`,
        city,
        state: getRandomItem(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']),
        country,
        zipCode: generateZipCode(),
        coordinates: {
          latitude: getRandomNumber(-90, 90, 6),
          longitude: getRandomNumber(-180, 180, 6),
        },
        timezone: getRandomItem(['UTC-8', 'UTC-5', 'UTC', 'UTC+1', 'UTC+8', 'UTC+9']),
      }
    : ({} as AddressInfo)

  const workInfo: WorkInfo = settings.includeWork
    ? {
        jobTitle: getRandomItem(jobTitles),
        company: getRandomItem(companies),
        department: getRandomItem([
          'Engineering',
          'Marketing',
          'Sales',
          'HR',
          'Finance',
          'Operations',
          'IT',
          'Legal',
          'R&D',
          'Customer Service',
        ]),
        industry: getRandomItem(industries),
        experience: getRandomNumber(0, 20),
        salary: getRandomNumber(30000, 200000),
        skills: getRandomItems(skills, getRandomNumber(3, 8)),
        education: {
          degree: getRandomItem(['Bachelor', 'Master', 'PhD', 'Associate', 'High School']),
          major: getRandomItem([
            'Computer Science',
            'Business',
            'Engineering',
            'Psychology',
            'Biology',
            'Mathematics',
            'English',
            'History',
            'Art',
            'Economics',
          ]),
          university: getRandomItem([
            'MIT',
            'Stanford',
            'Harvard',
            'Berkeley',
            'Yale',
            'Princeton',
            'Columbia',
            'NYU',
            'UCLA',
            'USC',
          ]),
          graduationYear: getRandomNumber(1990, 2023),
        },
      }
    : ({} as WorkInfo)

  const financialInfo: FinancialInfo = settings.includeFinancial
    ? {
        creditCardNumber: generateCreditCardNumber(),
        creditCardType: getRandomItem(['Visa', 'MasterCard', 'American Express', 'Discover']),
        bankAccount: generateBankAccount(),
        routingNumber: generateRoutingNumber(),
        currency: 'USD',
        monthlyIncome: getRandomNumber(2000, 15000),
        creditScore: getRandomNumber(300, 850),
      }
    : ({} as FinancialInfo)

  const socialInfo: SocialInfo = settings.includeSocial
    ? {
        bio: generateBio(firstName, personalInfo.age),
        interests: getRandomItems(interests, getRandomNumber(3, 7)),
        hobbies: getRandomItems(interests, getRandomNumber(2, 5)),
        languages: getRandomItems(languages, getRandomNumber(1, 4)),
        personalityType: getRandomItem([
          'INTJ',
          'INTP',
          'ENTJ',
          'ENTP',
          'INFJ',
          'INFP',
          'ENFJ',
          'ENFP',
          'ISTJ',
          'ISFJ',
          'ESTJ',
          'ESFJ',
          'ISTP',
          'ISFP',
          'ESTP',
          'ESFP',
        ]),
        favoriteColor: getRandomItem([
          'Blue',
          'Red',
          'Green',
          'Purple',
          'Orange',
          'Yellow',
          'Pink',
          'Black',
          'White',
          'Gray',
        ]),
        favoriteFood: getRandomItem([
          'Pizza',
          'Sushi',
          'Pasta',
          'Burger',
          'Salad',
          'Steak',
          'Chicken',
          'Fish',
          'Tacos',
          'Ice Cream',
        ]),
        favoriteMovie: getRandomItem([
          'The Shawshank Redemption',
          'The Godfather',
          'Pulp Fiction',
          'The Dark Knight',
          'Forrest Gump',
          'Inception',
          'The Matrix',
          'Goodfellas',
          'The Lord of the Rings',
          'Star Wars',
        ]),
        favoriteBook: getRandomItem([
          'To Kill a Mockingbird',
          '1984',
          'Pride and Prejudice',
          'The Great Gatsby',
          'Harry Potter',
          'The Catcher in the Rye',
          'Lord of the Flies',
          'Jane Eyre',
          'Wuthering Heights',
          'The Hobbit',
        ]),
      }
    : ({} as SocialInfo)

  const preferences: UserPreferences = {
    theme: getRandomItem(['light', 'dark', 'auto']),
    language: getRandomItem(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']),
    timezone: addressInfo.timezone || 'UTC',
    notifications: Math.random() > 0.3,
    privacy: getRandomItem(['public', 'private', 'friends']),
  }

  const metadata: UserMetadata = {
    userAgent: generateUserAgent(),
    ipAddress: generateIPAddress(),
    registrationDate: generateRandomDate(new Date(2020, 0, 1), new Date()),
    lastLogin: generateRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
    accountStatus: getRandomItem(['active', 'inactive', 'suspended']),
    verificationStatus: Math.random() > 0.2,
    profileCompleteness: getRandomNumber(60, 100),
  }

  return {
    id: nanoid(),
    personalInfo,
    contactInfo,
    addressInfo,
    workInfo,
    financialInfo,
    socialInfo,
    preferences,
    metadata,
    createdAt: new Date(),
  }
}

// Helper functions
const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

const getRandomItems = <T,>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

const getRandomNumber = (min: number, max: number, decimals = 0): number => {
  const num = Math.random() * (max - min) + min
  return decimals > 0 ? parseFloat(num.toFixed(decimals)) : Math.floor(num)
}

const generateEmail = (firstName: string, lastName: string): string => {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com', 'email.com', 'mail.com']
  const separators = ['.', '_', '']
  const separator = getRandomItem(separators)
  const domain = getRandomItem(domains)
  const number = Math.random() > 0.7 ? getRandomNumber(1, 999) : ''
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${number}@${domain}`
}

const generatePhoneNumber = (): string => {
  const areaCode = getRandomNumber(200, 999)
  const exchange = getRandomNumber(200, 999)
  const number = getRandomNumber(1000, 9999)
  return `+1-${areaCode}-${exchange}-${number}`
}

const generateZipCode = (): string => {
  return getRandomNumber(10000, 99999).toString()
}

const generateCreditCardNumber = (): string => {
  const prefix = getRandomItem(['4', '5', '3', '6']) // Visa, MC, Amex, Discover
  let number = prefix
  for (let i = 1; i < 16; i++) {
    number += getRandomNumber(0, 9)
  }
  return number.replace(/(.{4})/g, '$1 ').trim()
}

const generateBankAccount = (): string => {
  return getRandomNumber(100000000, 999999999).toString()
}

const generateRoutingNumber = (): string => {
  return getRandomNumber(100000000, 999999999).toString()
}

const generateBio = (name: string, age: number): string => {
  const templates = [
    `Hi, I'm ${name}! I'm ${age} years old and love exploring new opportunities.`,
    `${name} here - passionate about life and always learning something new.`,
    `Welcome to my profile! I'm ${name}, ${age} years young and ready for adventure.`,
    `${name} - ${age} years of experience in making every day count.`,
    `Hello! I'm ${name}. At ${age}, I believe the best is yet to come.`,
  ]
  return getRandomItem(templates)
}

const generateUserAgent = (): string => {
  const browsers = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  ]
  return getRandomItem(browsers)
}

const generateIPAddress = (): string => {
  return `${getRandomNumber(1, 255)}.${getRandomNumber(0, 255)}.${getRandomNumber(0, 255)}.${getRandomNumber(1, 254)}`
}

const generateRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// User Templates
const userTemplates: UserTemplate[] = [
  {
    id: 'basic-user',
    name: 'Basic User',
    description: 'Simple user profile with essential information',
    category: 'General',
    settings: {
      locale: 'en-US',
      gender: 'random',
      ageRange: { min: 18, max: 65 },
      includeFinancial: false,
      includeSocial: false,
      includeWork: false,
      includeAddress: true,
      realData: false,
      customFields: [],
    },
    useCase: ['Testing', 'Prototyping', 'Basic demos', 'Simple applications'],
    examples: ['User registration', 'Profile creation', 'Contact forms', 'Basic listings'],
    preview: {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        gender: 'male',
        age: 30,
      } as PersonalInfo,
      contactInfo: {
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
      } as ContactInfo,
    } as Partial<FakeUser>,
  },
  {
    id: 'professional-user',
    name: 'Professional User',
    description: 'Complete professional profile with work information',
    category: 'Business',
    settings: {
      locale: 'en-US',
      gender: 'random',
      ageRange: { min: 25, max: 55 },
      includeFinancial: false,
      includeSocial: true,
      includeWork: true,
      includeAddress: true,
      realData: false,
      customFields: [],
    },
    useCase: ['LinkedIn-style profiles', 'Professional networks', 'Job platforms', 'Business directories'],
    examples: ['Employee profiles', 'Professional networking', 'Resume data', 'Company directories'],
    preview: {
      personalInfo: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        fullName: 'Sarah Johnson',
        gender: 'female',
        age: 35,
      } as PersonalInfo,
      workInfo: {
        jobTitle: 'Software Engineer',
        company: 'TechCorp',
        industry: 'Technology',
      } as WorkInfo,
    } as Partial<FakeUser>,
  },
  {
    id: 'ecommerce-customer',
    name: 'E-commerce Customer',
    description: 'Customer profile with financial and address information',
    category: 'E-commerce',
    settings: {
      locale: 'en-US',
      gender: 'random',
      ageRange: { min: 18, max: 70 },
      includeFinancial: true,
      includeSocial: false,
      includeWork: false,
      includeAddress: true,
      realData: false,
      customFields: [],
    },
    useCase: ['Online stores', 'Payment systems', 'Shipping platforms', 'Customer databases'],
    examples: ['Customer profiles', 'Order management', 'Payment processing', 'Shipping addresses'],
    preview: {
      personalInfo: {
        firstName: 'Michael',
        lastName: 'Brown',
        fullName: 'Michael Brown',
        gender: 'male',
        age: 42,
      } as PersonalInfo,
      financialInfo: {
        creditCardType: 'Visa',
        monthlyIncome: 5000,
      } as FinancialInfo,
    } as Partial<FakeUser>,
  },
  {
    id: 'social-media-user',
    name: 'Social Media User',
    description: 'Social profile with interests and social information',
    category: 'Social',
    settings: {
      locale: 'en-US',
      gender: 'random',
      ageRange: { min: 16, max: 45 },
      includeFinancial: false,
      includeSocial: true,
      includeWork: false,
      includeAddress: false,
      realData: false,
      customFields: [],
    },
    useCase: ['Social networks', 'Dating apps', 'Community platforms', 'Interest-based apps'],
    examples: ['Social profiles', 'User interests', 'Community members', 'Social connections'],
    preview: {
      personalInfo: {
        firstName: 'Emma',
        lastName: 'Wilson',
        fullName: 'Emma Wilson',
        gender: 'female',
        age: 28,
      } as PersonalInfo,
      socialInfo: {
        interests: ['Photography', 'Travel', 'Music'],
        bio: 'Love exploring new places and capturing moments!',
      } as SocialInfo,
    } as Partial<FakeUser>,
  },
  {
    id: 'international-user',
    name: 'International User',
    description: 'Diverse user profile with international data',
    category: 'Global',
    settings: {
      locale: 'mixed',
      gender: 'random',
      ageRange: { min: 18, max: 65 },
      includeFinancial: false,
      includeSocial: true,
      includeWork: true,
      includeAddress: true,
      realData: false,
      customFields: [],
    },
    useCase: ['Global platforms', 'Multi-language apps', 'International services', 'Diverse testing'],
    examples: ['Global user base', 'Multi-cultural data', 'International testing', 'Localization testing'],
    preview: {
      personalInfo: {
        firstName: 'Akira',
        lastName: 'Tanaka',
        fullName: 'Akira Tanaka',
        gender: 'male',
        age: 31,
        nationality: 'Japan',
      } as PersonalInfo,
    } as Partial<FakeUser>,
  },
  {
    id: 'complete-user',
    name: 'Complete User',
    description: 'Full user profile with all available information',
    category: 'Comprehensive',
    settings: {
      locale: 'en-US',
      gender: 'random',
      ageRange: { min: 18, max: 65 },
      includeFinancial: true,
      includeSocial: true,
      includeWork: true,
      includeAddress: true,
      realData: false,
      customFields: [],
    },
    useCase: ['Comprehensive testing', 'Full feature demos', 'Complete user systems', 'Advanced applications'],
    examples: ['Full user profiles', 'Complete datasets', 'Advanced testing', 'Feature-rich applications'],
    preview: {
      personalInfo: {
        firstName: 'Alexandra',
        lastName: 'Rodriguez',
        fullName: 'Alexandra Rodriguez',
        gender: 'female',
        age: 29,
      } as PersonalInfo,
      workInfo: {
        jobTitle: 'Product Manager',
        company: 'InnovateLab',
      } as WorkInfo,
      socialInfo: {
        interests: ['Technology', 'Innovation', 'Leadership'],
      } as SocialInfo,
    } as Partial<FakeUser>,
  },
]

// User analysis functions
const analyzeUser = (user: FakeUser) => {
  const analysis = {
    completeness: calculateCompleteness(user),
    diversity: calculateDiversity(user),
    realism: calculateRealism(user),
    consistency: calculateConsistency(user),
  }

  return analysis
}

const calculateCompleteness = (user: FakeUser): number => {
  let totalFields = 0
  let filledFields = 0

  // Count personal info fields
  Object.values(user.personalInfo).forEach((value) => {
    totalFields++
    if (value !== null && value !== undefined && value !== '') filledFields++
  })

  // Count contact info fields
  Object.values(user.contactInfo).forEach((value) => {
    totalFields++
    if (value !== null && value !== undefined && value !== '') filledFields++
  })

  // Count other sections if they exist
  if (user.addressInfo && Object.keys(user.addressInfo).length > 0) {
    Object.values(user.addressInfo).forEach((value) => {
      totalFields++
      if (value !== null && value !== undefined && value !== '') filledFields++
    })
  }

  if (user.workInfo && Object.keys(user.workInfo).length > 0) {
    Object.values(user.workInfo).forEach((value) => {
      totalFields++
      if (value !== null && value !== undefined && value !== '') filledFields++
    })
  }

  return totalFields > 0 ? (filledFields / totalFields) * 100 : 0
}

const calculateDiversity = (user: FakeUser): number => {
  // Simple diversity calculation based on variety of data
  let diversityScore = 50

  if (user.personalInfo.nationality !== 'United States') diversityScore += 10
  if (user.socialInfo?.languages && user.socialInfo.languages.length > 1) diversityScore += 10
  if (user.workInfo?.industry && user.workInfo.industry !== 'Technology') diversityScore += 10
  if (user.personalInfo.ethnicity !== 'Caucasian') diversityScore += 10
  if (user.personalInfo.age < 25 || user.personalInfo.age > 50) diversityScore += 10

  return Math.min(100, diversityScore)
}

const calculateRealism = (user: FakeUser): number => {
  let realismScore = 100

  // Check for unrealistic combinations
  if (user.personalInfo.age < 22 && user.workInfo?.experience > 5) realismScore -= 20
  if (user.workInfo?.salary > 200000 && user.personalInfo.age < 30) realismScore -= 15
  if (user.financialInfo?.creditScore > 800 && user.personalInfo.age < 25) realismScore -= 10

  return Math.max(0, realismScore)
}

const calculateConsistency = (user: FakeUser): number => {
  let consistencyScore = 100

  // Check for consistency issues
  if (user.contactInfo.email.includes(user.personalInfo.firstName.toLowerCase()) === false) {
    consistencyScore -= 5
  }

  if (user.addressInfo?.timezone && user.workInfo?.company) {
    // Simple timezone consistency check
    consistencyScore += 0 // Placeholder for more complex logic
  }

  return Math.max(0, consistencyScore)
}

// Custom hooks
const useFakeUserGenerator = () => {
  const [users, setUsers] = useState<FakeUser[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateUser = useCallback(async (settings: GenerationSettings): Promise<FakeUser> => {
    setIsGenerating(true)
    try {
      const user = generateFakeUser(settings)
      setUsers((prev) => [user, ...prev])
      return user
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const generateBatch = useCallback(async (batchSettings: BatchSettings): Promise<UserBatch> => {
    setIsGenerating(true)
    const startTime = performance.now()

    try {
      const batch: UserBatch = {
        id: nanoid(),
        name: batchSettings.namingPattern || 'User Batch',
        users: [],
        settings: batchSettings,
        status: 'processing',
        progress: 0,
        statistics: {
          totalGenerated: 0,
          successfulGenerated: 0,
          failedGenerated: 0,
          averageAge: 0,
          genderDistribution: {},
          nationalityDistribution: {},
          totalProcessingTime: 0,
          averageProcessingTime: 0,
        },
        createdAt: new Date(),
      }

      const results: FakeUser[] = []

      for (let i = 0; i < batchSettings.count; i++) {
        try {
          const user = generateFakeUser(batchSettings.baseSettings)
          results.push(user)

          // Update progress
          const progress = ((i + 1) / batchSettings.count) * 100
          batch.progress = progress
        } catch (error: any) {
          console.error('Failed to generate user:', error)
        }
      }

      const endTime = performance.now()
      const totalProcessingTime = endTime - startTime

      // Calculate statistics
      const successful = results.filter((u) => u.id)
      const genderDistribution: Record<string, number> = {}
      const nationalityDistribution: Record<string, number> = {}
      let totalAge = 0

      successful.forEach((user) => {
        genderDistribution[user.personalInfo.gender] = (genderDistribution[user.personalInfo.gender] || 0) + 1
        nationalityDistribution[user.personalInfo.nationality] =
          (nationalityDistribution[user.personalInfo.nationality] || 0) + 1
        totalAge += user.personalInfo.age
      })

      const statistics: BatchStatistics = {
        totalGenerated: results.length,
        successfulGenerated: successful.length,
        failedGenerated: results.length - successful.length,
        averageAge: successful.length > 0 ? totalAge / successful.length : 0,
        genderDistribution,
        nationalityDistribution,
        totalProcessingTime,
        averageProcessingTime: totalProcessingTime / results.length,
      }

      batch.users = results
      batch.status = 'completed'
      batch.progress = 100
      batch.statistics = statistics
      batch.completedAt = new Date()

      setUsers((prev) => [...results, ...prev])
      return batch
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id))
  }, [])

  const clearUsers = useCallback(() => {
    setUsers([])
  }, [])

  return {
    users,
    isGenerating,
    generateUser,
    generateBatch,
    removeUser,
    clearUsers,
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
    } catch (error: any) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useUserExport = () => {
  const exportUser = useCallback((user: FakeUser, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(user, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromUser(user)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        content = generateXMLFromUser(user)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'sql':
        content = generateSQLFromUser(user)
        mimeType = 'text/plain'
        extension = '.sql'
        break
      case 'yaml':
        content = generateYAMLFromUser(user)
        mimeType = 'text/yaml'
        extension = '.yaml'
        break
      default:
        content = JSON.stringify(user, null, 2)
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `fake-user-${user.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback((batch: UserBatch) => {
    // Implementation would depend on the format
    // For now, just export as JSON
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

  return { exportUser, exportBatch }
}

// Helper functions for export formats
const generateCSVFromUser = (user: FakeUser): string => {
  const headers = [
    'ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Age',
    'Gender',
    'City',
    'Country',
    'Job Title',
    'Company',
    'Salary',
  ]

  const values = [
    user.id,
    user.personalInfo.firstName,
    user.personalInfo.lastName,
    user.contactInfo.email,
    user.contactInfo.phone,
    user.personalInfo.age.toString(),
    user.personalInfo.gender,
    user.addressInfo?.city || '',
    user.addressInfo?.country || '',
    user.workInfo?.jobTitle || '',
    user.workInfo?.company || '',
    user.workInfo?.salary?.toString() || '',
  ]

  return [headers.join(','), values.map((v) => `"${v}"`).join(',')].join('\n')
}

const generateXMLFromUser = (user: FakeUser): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<user id="${user.id}">
  <personalInfo>
    <firstName>${user.personalInfo.firstName}</firstName>
    <lastName>${user.personalInfo.lastName}</lastName>
    <age>${user.personalInfo.age}</age>
    <gender>${user.personalInfo.gender}</gender>
    <nationality>${user.personalInfo.nationality}</nationality>
  </personalInfo>
  <contactInfo>
    <email>${user.contactInfo.email}</email>
    <phone>${user.contactInfo.phone}</phone>
  </contactInfo>
  ${
    user.addressInfo
      ? `
  <addressInfo>
    <city>${user.addressInfo.city}</city>
    <country>${user.addressInfo.country}</country>
  </addressInfo>`
      : ''
  }
  ${
    user.workInfo
      ? `
  <workInfo>
    <jobTitle>${user.workInfo.jobTitle}</jobTitle>
    <company>${user.workInfo.company}</company>
    <salary>${user.workInfo.salary}</salary>
  </workInfo>`
      : ''
  }
</user>`
}

const generateSQLFromUser = (user: FakeUser): string => {
  return `INSERT INTO users (
  id, first_name, last_name, email, phone, age, gender,
  city, country, job_title, company, salary, created_at
) VALUES (
  '${user.id}',
  '${user.personalInfo.firstName}',
  '${user.personalInfo.lastName}',
  '${user.contactInfo.email}',
  '${user.contactInfo.phone}',
  ${user.personalInfo.age},
  '${user.personalInfo.gender}',
  '${user.addressInfo?.city || ''}',
  '${user.addressInfo?.country || ''}',
  '${user.workInfo?.jobTitle || ''}',
  '${user.workInfo?.company || ''}',
  ${user.workInfo?.salary || 'NULL'},
  '${user.createdAt.toISOString()}'
);`
}

const generateYAMLFromUser = (user: FakeUser): string => {
  return `id: ${user.id}
personalInfo:
  firstName: ${user.personalInfo.firstName}
  lastName: ${user.personalInfo.lastName}
  age: ${user.personalInfo.age}
  gender: ${user.personalInfo.gender}
  nationality: ${user.personalInfo.nationality}
contactInfo:
  email: ${user.contactInfo.email}
  phone: ${user.contactInfo.phone}
${
  user.addressInfo
    ? `addressInfo:
  city: ${user.addressInfo.city}
  country: ${user.addressInfo.country}`
    : ''
}
${
  user.workInfo
    ? `workInfo:
  jobTitle: ${user.workInfo.jobTitle}
  company: ${user.workInfo.company}
  salary: ${user.workInfo.salary}`
    : ''
}
createdAt: ${user.createdAt.toISOString()}`
}

/**
 * Enhanced Fake User Generator & Management Tool
 * Features: Advanced user generation, customization, analysis, and batch processing
 */
const FakeUserCore = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'batch' | 'gallery' | 'templates'>('generator')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<FakeUser | null>(null)
  const [settings, setSettings] = useState<GenerationSettings>({
    locale: 'en-US',
    gender: 'random',
    ageRange: { min: 18, max: 65 },
    includeFinancial: false,
    includeSocial: true,
    includeWork: true,
    includeAddress: true,
    realData: false,
    customFields: [],
  })

  const { users, isGenerating, generateUser, removeUser } = useFakeUserGenerator()
  const { exportUser } = useUserExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = userTemplates.find((t) => t.id === templateId)
    if (template) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate user
  const handleGenerate = useCallback(async () => {
    try {
      const user = await generateUser(settings)
      setCurrentUser(user)
      toast.success('Fake user generated successfully')
    } catch (error) {
      toast.error('Failed to generate fake user')
      console.error(error)
    }
  }, [settings, generateUser])

  return (
    <div className="w-full mx-auto space-y-6">
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
              <Users className="h-5 w-5" aria-hidden="true" />
              Fake User Generator & Management Tool
            </CardTitle>
            <CardDescription>
              Advanced fake user data generation tool with comprehensive customization, analysis, and batch processing.
              Create realistic user profiles for testing, prototyping, and development purposes. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'generator' | 'batch' | 'gallery' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* User Generator Tab */}
          <TabsContent value="generator" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Generator Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Generation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium">
                        Gender
                      </Label>
                      <Select
                        value={settings.gender || 'random'}
                        onValueChange={(value: 'male' | 'female' | 'random') =>
                          setSettings((prev) => ({ ...prev, gender: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Random</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="locale" className="text-sm font-medium">
                        Locale
                      </Label>
                      <Select
                        value={settings.locale}
                        onValueChange={(value: string) => setSettings((prev) => ({ ...prev, locale: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="en-GB">English (UK)</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                          <SelectItem value="fr-FR">French</SelectItem>
                          <SelectItem value="de-DE">German</SelectItem>
                          <SelectItem value="it-IT">Italian</SelectItem>
                          <SelectItem value="mixed">Mixed/International</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Age Range */}
                  <div>
                    <Label className="text-sm font-medium">Age Range</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="min-age" className="text-xs">
                          Min Age
                        </Label>
                        <Input
                          id="min-age"
                          type="number"
                          min="0"
                          max="100"
                          value={settings.ageRange.min}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              ageRange: { ...prev.ageRange, min: parseInt(e.target.value) || 18 },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-age" className="text-xs">
                          Max Age
                        </Label>
                        <Input
                          id="max-age"
                          type="number"
                          min="0"
                          max="100"
                          value={settings.ageRange.max}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              ageRange: { ...prev.ageRange, max: parseInt(e.target.value) || 65 },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Include Options */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Include Information</Label>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="include-address"
                          type="checkbox"
                          checked={settings.includeAddress}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeAddress: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-address" className="text-xs">
                          Address information
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-work"
                          type="checkbox"
                          checked={settings.includeWork}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeWork: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-work" className="text-xs">
                          Work and education information
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-financial"
                          type="checkbox"
                          checked={settings.includeFinancial}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeFinancial: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-financial" className="text-xs">
                          Financial information
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-social"
                          type="checkbox"
                          checked={settings.includeSocial}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeSocial: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-social" className="text-xs">
                          Social and personal interests
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="real-data"
                          type="checkbox"
                          checked={settings.realData}
                          onChange={(e) => setSettings((prev) => ({ ...prev, realData: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="real-data" className="text-xs">
                          Use more realistic data patterns
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
                      {isGenerating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Generate User
                    </Button>
                    <Button
                      onClick={() =>
                        setSettings({
                          locale: 'en-US',
                          gender: 'random',
                          ageRange: { min: 18, max: 65 },
                          includeFinancial: false,
                          includeSocial: true,
                          includeWork: true,
                          includeAddress: true,
                          realData: false,
                          customFields: [],
                        })
                      }
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* User Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    User Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentUser ? (
                    <div className="space-y-4">
                      {/* Personal Information */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <Label className="text-sm font-medium">Personal Information</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded">
                          <div>
                            <div>
                              <strong>Name:</strong> {currentUser.personalInfo.fullName}
                            </div>
                            <div>
                              <strong>Age:</strong> {currentUser.personalInfo.age}
                            </div>
                            <div>
                              <strong>Gender:</strong> {currentUser.personalInfo.gender}
                            </div>
                          </div>
                          <div>
                            <div>
                              <strong>Nationality:</strong> {currentUser.personalInfo.nationality}
                            </div>
                            <div>
                              <strong>Marital Status:</strong> {currentUser.personalInfo.maritalStatus}
                            </div>
                            <div>
                              <strong>Blood Type:</strong> {currentUser.personalInfo.bloodType}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <Label className="text-sm font-medium">Contact Information</Label>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm bg-muted/50 p-3 rounded">
                          <div>
                            <strong>Email:</strong> {currentUser.contactInfo.email}
                          </div>
                          <div>
                            <strong>Phone:</strong> {currentUser.contactInfo.phone}
                          </div>
                          {currentUser.contactInfo.website && (
                            <div>
                              <strong>Website:</strong> {currentUser.contactInfo.website}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Address Information */}
                      {currentUser.addressInfo && Object.keys(currentUser.addressInfo).length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            <Label className="text-sm font-medium">Address Information</Label>
                          </div>
                          <div className="text-sm bg-muted/50 p-3 rounded">
                            <div>{currentUser.addressInfo.street}</div>
                            <div>
                              {currentUser.addressInfo.city}, {currentUser.addressInfo.state}{' '}
                              {currentUser.addressInfo.zipCode}
                            </div>
                            <div>{currentUser.addressInfo.country}</div>
                          </div>
                        </div>
                      )}

                      {/* Work Information */}
                      {currentUser.workInfo && Object.keys(currentUser.workInfo).length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <Label className="text-sm font-medium">Work Information</Label>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded">
                            <div>
                              <div>
                                <strong>Job Title:</strong> {currentUser.workInfo.jobTitle}
                              </div>
                              <div>
                                <strong>Company:</strong> {currentUser.workInfo.company}
                              </div>
                              <div>
                                <strong>Industry:</strong> {currentUser.workInfo.industry}
                              </div>
                            </div>
                            <div>
                              <div>
                                <strong>Experience:</strong> {currentUser.workInfo.experience} years
                              </div>
                              <div>
                                <strong>Salary:</strong> ${currentUser.workInfo.salary?.toLocaleString()}
                              </div>
                              <div>
                                <strong>Department:</strong> {currentUser.workInfo.department}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Social Information */}
                      {currentUser.socialInfo && Object.keys(currentUser.socialInfo).length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <Label className="text-sm font-medium">Social Information</Label>
                          </div>
                          <div className="text-sm bg-muted/50 p-3 rounded space-y-2">
                            {currentUser.socialInfo.bio && (
                              <div>
                                <strong>Bio:</strong> {currentUser.socialInfo.bio}
                              </div>
                            )}
                            {currentUser.socialInfo.interests && currentUser.socialInfo.interests.length > 0 && (
                              <div>
                                <strong>Interests:</strong> {currentUser.socialInfo.interests.join(', ')}
                              </div>
                            )}
                            {currentUser.socialInfo.languages && currentUser.socialInfo.languages.length > 0 && (
                              <div>
                                <strong>Languages:</strong> {currentUser.socialInfo.languages.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Financial Information */}
                      {currentUser.financialInfo && Object.keys(currentUser.financialInfo).length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <Label className="text-sm font-medium">Financial Information</Label>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded">
                            <div>
                              <div>
                                <strong>Credit Card:</strong> {currentUser.financialInfo.creditCardType}
                              </div>
                              <div>
                                <strong>Monthly Income:</strong> $
                                {currentUser.financialInfo.monthlyIncome?.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div>
                                <strong>Credit Score:</strong> {currentUser.financialInfo.creditScore}
                              </div>
                              <div>
                                <strong>Currency:</strong> {currentUser.financialInfo.currency}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* User Analysis */}
                      <div className="space-y-3 border-t pt-4">
                        <Label className="text-sm font-medium">User Analysis</Label>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {(() => {
                            const analysis = analyzeUser(currentUser)
                            return (
                              <>
                                <div>
                                  <div className="font-medium">Completeness</div>
                                  <div className="text-lg">{analysis.completeness.toFixed(0)}%</div>
                                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                    <div
                                      className={`h-1 rounded-full ${
                                        analysis.completeness >= 80
                                          ? 'bg-green-500'
                                          : analysis.completeness >= 60
                                            ? 'bg-orange-500'
                                            : 'bg-red-500'
                                      }`}
                                      style={{ width: `${analysis.completeness}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium">Diversity</div>
                                  <div className="text-lg">{analysis.diversity.toFixed(0)}%</div>
                                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                    <div
                                      className={`h-1 rounded-full ${
                                        analysis.diversity >= 80
                                          ? 'bg-green-500'
                                          : analysis.diversity >= 60
                                            ? 'bg-orange-500'
                                            : 'bg-red-500'
                                      }`}
                                      style={{ width: `${analysis.diversity}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium">Realism</div>
                                  <div className="text-lg">{analysis.realism.toFixed(0)}%</div>
                                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                    <div
                                      className={`h-1 rounded-full ${
                                        analysis.realism >= 80
                                          ? 'bg-green-500'
                                          : analysis.realism >= 60
                                            ? 'bg-orange-500'
                                            : 'bg-red-500'
                                      }`}
                                      style={{ width: `${analysis.realism}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium">Consistency</div>
                                  <div className="text-lg">{analysis.consistency.toFixed(0)}%</div>
                                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                    <div
                                      className={`h-1 rounded-full ${
                                        analysis.consistency >= 80
                                          ? 'bg-green-500'
                                          : analysis.consistency >= 60
                                            ? 'bg-orange-500'
                                            : 'bg-red-500'
                                      }`}
                                      style={{ width: `${analysis.consistency}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={() => exportUser(currentUser, 'json')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button onClick={() => exportUser(currentUser, 'csv')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button onClick={() => exportUser(currentUser, 'xml')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          XML
                        </Button>
                        <Button
                          onClick={() => copyToClipboard(JSON.stringify(currentUser, null, 2), 'User Data')}
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === 'User Data' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No User Generated</h3>
                      <p className="text-muted-foreground mb-4">
                        Configure settings and click "Generate User" to create a fake user profile
                      </p>
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
                <CardTitle className="text-lg">Batch User Generation</CardTitle>
                <CardDescription>Generate multiple users at once</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
                  <p className="text-muted-foreground">Batch user generation functionality coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Gallery</CardTitle>
                <CardDescription>View and manage your generated users</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.slice(0, 12).map((user) => (
                      <div key={user.id} className="border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div className="font-medium text-sm">{user.personalInfo.fullName}</div>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <strong>Age:</strong> {user.personalInfo.age}
                            </div>
                            <div>
                              <strong>Email:</strong> {user.contactInfo.email}
                            </div>
                            {user.workInfo?.jobTitle && (
                              <div>
                                <strong>Job:</strong> {user.workInfo.jobTitle}
                              </div>
                            )}
                            {user.addressInfo?.city && (
                              <div>
                                <strong>Location:</strong> {user.addressInfo.city}, {user.addressInfo.country}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportUser(user, 'json')}
                              className="flex-1"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => removeUser(user.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Users</h3>
                    <p className="text-muted-foreground">Generate some users to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Templates</CardTitle>
                <CardDescription>Pre-configured user generation templates for common use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userTemplates.map((template) => (
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
const FakeUser = () => {
  return <FakeUserCore />
}

export default FakeUser
