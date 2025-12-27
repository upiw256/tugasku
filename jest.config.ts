import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Path ke aplikasi Next.js Anda
  dir: './',
})

// Konfigurasi Custom Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node', // Kita tes Server Action (Node.js environment)
  moduleNameMapper: {
    // Mapping alias @/ ke folder root
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)