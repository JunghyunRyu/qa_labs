const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-markdown$': '<rootDir>/__mocks__/react-markdown.js',
    '^react-resizable-panels$': '<rootDir>/__mocks__/react-resizable-panels.js',
    '^recharts$': '<rootDir>/__mocks__/recharts.js',
    '^remark-gfm$': '<rootDir>/__mocks__/remark-gfm.js',
    '^remark-breaks$': '<rootDir>/__mocks__/remark-breaks.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|react-resizable-panels|recharts|remark-gfm|remark-breaks|remark-parse|unified|unist-util-visit|micromark|mdast|bail|is-plain-obj|trough|vfile|devlop|hast-util-to-jsx-runtime|estree-util-is-identifier-name|hast-util-whitespace|property-information|space-separated-tokens|comma-separated-tokens|decode-named-character-reference|character-entities)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

