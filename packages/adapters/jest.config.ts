import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@gamehub/config$': '<rootDir>/../config/src/index.ts',
    '^@gamehub/config/(.*)$': '<rootDir>/../config/src/$1',
    '^@gamehub/domain$': '<rootDir>/../domain/src/index.ts',
    '^@gamehub/domain/(.*)$': '<rootDir>/../domain/src/$1',
  },
};

export default config;
