import globals from "globals";
import pluginJs from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  // Override for Node/JS config files
  {
    files: ["jest.config.js", "pm2.config.js"],
    languageOptions: {
      globals: globals.node, // Node globals like `module`
      sourceType: "script", // Treat as CommonJS script
    },
    rules: {
      "no-undef": "off", // disable no-undef for these files
    },
  },
];
