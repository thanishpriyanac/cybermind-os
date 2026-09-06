import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  testTimeout: 120_000, // 2 min per test — resilience scenarios take time
  globalTimeout: 600_000, // 10 min total suite
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '../../tsconfig.base.json' }],
  },
};

export default config;
