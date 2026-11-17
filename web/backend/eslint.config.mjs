export default [{
  files: ["**/*.js", "**/*.mjs"],
  languageOptions: { ecmaVersion: "latest" },
  rules: { "no-unused-vars": ["error", { argsIgnorePattern: "^_" }], "no-constant-condition": "error" },
}];
