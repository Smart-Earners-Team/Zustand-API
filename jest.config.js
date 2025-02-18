/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom", // Changed from "node" to "jsdom"
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {}],
  },
  testMatch: ["**/tests/**/*.(test|spec).(ts|tsx)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
