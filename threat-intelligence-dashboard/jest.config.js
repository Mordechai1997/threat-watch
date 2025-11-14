/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
};