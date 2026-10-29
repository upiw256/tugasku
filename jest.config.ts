import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Path ke aplikasi Next.js Anda
  dir: './',
})

// Konfigurasi Custom Jest
const customConfig: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default async function () {
  const configFn = createJestConfig(customConfig);
  const finalConfig = await configFn();
  finalConfig.transformIgnorePatterns = ['/node_modules/(?!(jose)/)'];
  return finalConfig;
}