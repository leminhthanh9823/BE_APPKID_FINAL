module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};