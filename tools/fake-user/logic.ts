export interface FakeUser {
  firstName: string
  lastName: string
  email: string
  username: string
  phone: string
  city: string
  country: string
}

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Riley", "Casey", "Avery", "Quinn"]
const LAST_NAMES = ["Sample", "Example", "Test", "Demo", "Fiction", "Mock", "Placeholder", "Local"]
const CITIES = ["Sampleton", "Example City", "Testville", "Mock Harbor", "Demo Falls"]

function choose<T>(values: T[], random: () => number): T {
  const sample = random()
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new Error("Random source must return a value between 0 and 1.")
  }
  return values[Math.floor(sample * values.length)]!
}

export function generateFakeUser(random: () => number = Math.random): FakeUser {
  const firstName = choose(FIRST_NAMES, random)
  const lastName = choose(LAST_NAMES, random)
  const suffix = String(choose(Array.from({ length: 10 }, (_, index) => index), random)).padStart(2, "0")
  const phoneSuffix = String(choose(Array.from({ length: 100 }, (_, index) => index), random)).padStart(2, "0")
  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@example.test`,
    username: `${firstName.toLowerCase()}_${lastName.toLowerCase()}${suffix}`,
    phone: `+1-202-555-01${phoneSuffix}`,
    city: choose(CITIES, random),
    country: "US",
  }
}
