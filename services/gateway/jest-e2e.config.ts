import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: {
        types: ['jest', 'node']
      },
      useESM: true,
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|jose)/)'
  ],
  moduleNameMapper: {
    '^@cybermind-os/logger$': '<rootDir>/../../packages/sdk/logger/src/index.ts',
    '^@cybermind-os/event-client$': '<rootDir>/../../packages/sdk/event-client/src/index.ts',
  },
  setupFiles: ['dotenv/config'],
};

export default config;
