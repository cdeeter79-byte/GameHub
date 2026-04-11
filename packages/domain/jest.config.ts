import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@gamehub/config$': '<rootDir>/../config/src/index.ts',
    '^@gamehub/config/(.*)$': '<rootDir>/../config/src/$1',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/__fixtures__/**', '!src/**/index.ts'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 },
  },
};

export default config;
