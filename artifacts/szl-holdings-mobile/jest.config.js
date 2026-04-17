/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs", esModuleInterop: true, strict: false } }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^expo-router$": "<rootDir>/__mocks__/expo-router.js",
    "^expo-.*$": "<rootDir>/__mocks__/expo-modules.js",
    "^react-native$": "<rootDir>/__mocks__/react-native.js",
    "^@react-native-async-storage/async-storage$": "<rootDir>/__mocks__/async-storage.js",
    "^@expo/vector-icons$": "<rootDir>/__mocks__/expo-icons.js",
    "^@szl-holdings/.*$": "<rootDir>/__mocks__/szl-modules.js",
  },
  testPathIgnorePatterns: ["/node_modules/"],
};
