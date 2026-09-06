import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          types: ['jest', 'node'],
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@cybermind-os/(.*)$': '<rootDir>/../../packages/sdk/$1/src/index.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  setupFilesAfterEnv: [],
  setupFiles: ['dotenv/config'],
};

export default config;
