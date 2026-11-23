// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import designSystem from "./eslint-plugin/index.js";

export default defineConfig([globalIgnores(["dist", "storybook-static"]), {
  files: ["**/*.{ts,tsx}"],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
  ],
  languageOptions: {
    globals: globals.browser,
  },
}, {
  // Dogfood the shipped enforcement rules on the library source itself.
  files: ["src/**/*.{ts,tsx}"],
  plugins: { "design-system": designSystem },
  rules: {
    "design-system/no-hardcoded-colors": "error",
    // The library defines the primitives, so raw <button>/<input> are the
    // point here — the raw-elements rule targets consumers, not this repo.
    "design-system/no-raw-ui-elements": "off",
    // Stories are consumer examples — they must obey the layout-only rule.
    "design-system/layout-only-classname": "warn",
  },
}, {
  // Stories and Storybook config aren't part of the shipped library —
  // react-refresh constraints don't apply to them.
  // Story files, and story-helper modules shared by several of them
  // (`src/test/fixtures/*-stories.tsx`), mix components and helpers.
  files: ["src/**/*.stories.tsx", "src/test/fixtures/*-stories.tsx", ".storybook/**/*.{ts,tsx}"],
  rules: {
    "react-refresh/only-export-components": "off",
  },
}, ...storybook.configs["flat/recommended"]])
