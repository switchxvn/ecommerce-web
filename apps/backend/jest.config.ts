import type { Config } from 'jest';

const config: Config = {
  rootDir: 'src',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.app.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@ew/shared$': '<rootDir>/../../../libs/shared/src/index.ts',
    '^@ew/shared/(.*)$': '<rootDir>/../../../libs/shared/src/$1',
  },
};

export default config;
