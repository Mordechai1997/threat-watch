/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  
    // 💡 תיקון 1: הפעלת סביבת DOM (חיוני לבדיקות React)
    testEnvironment: "jsdom",
  
    // 💡 תיקון 2: טעינת קובץ ה-Setup שמוסיף את ה-Matchers (כמו toBeInTheDocument)
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], 
  
    // 💡 תיקון 3: מיפוי נתיבים (Path Aliases) שתוקן!
    // חשוב: נתיב היעד משתמש ב-slash קדימה (/) גם ב-Windows
    moduleNameMapper: {
        // ממפה את '@/' לנתיב הפיזי של תיקיית src/ באמצעות <rootDir>
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    
    // 💡 תיקון 4: הפעלת ה-Transformer לטיפול ב-TypeScript ו-ESM
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest'],
    },
    
    // שדות קיימים:
    coverageProvider: "v8",
    clearMocks: true, 
    moduleFileExtensions: [
      "js",
      "jsx",
      "ts",
      "tsx",
      "json",
      "node"
    ],
    testMatch: [
      "**/__tests__/**/*.?([jt])s?(x)",
      "**/?(*.)+(spec|test).?([jt])s?(x)"
    ],

};

module.exports = config;