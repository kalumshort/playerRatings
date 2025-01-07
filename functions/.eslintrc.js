module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    "no-restricted-globals": ["error", "name", "length"], // Keep as error for restricted globals
    "prefer-arrow-callback": "error", // Keep as error to encourage arrow functions
    quotes: ["warn", "double", { allowTemplateLiterals: true }], // Allow template literals but warn on quotes inconsistency
    "object-curly-spacing": ["warn", "always"], // Just a warning for curly spacing
    indent: ["warn", 2], // Warn for indentation errors but don't treat as error
    "quote-props": ["warn", "always"], // Warn for inconsistent property quotes
    "max-len": ["warn", { code: 120 }], // Warn when lines exceed 120 characters, but don't treat as error
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
