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
    "no-restricted-globals": "off", // Disable restriction on globals
    "prefer-arrow-callback": "off", // Allow using traditional function syntax
    quotes: "off", // No enforcement of quotes style
    "object-curly-spacing": "off", // No enforcement of spacing inside curly braces
    indent: "off", // No enforcement of indentation
    "quote-props": "off", // No enforcement of property quotes style
    "max-len": "off", // No restriction on line length
    "linebreak-style": "off",
    "comma-dangle": "off",
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
