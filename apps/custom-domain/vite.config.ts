import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    extends: ["../../.oxlintrc.json"],
    plugins: ["typescript", "react", "nextjs"],
    ignorePatterns: [".next/**", "out/**", "build/**", "next-env.d.ts"],
    settings: {
      "better-tailwindcss": {
        cwd: "./apps/custom-domain",
        entryPoint: "./src/app/globals.css",
      },
    },
    rules: {
      "only-export-components": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    overrides: [
      {
        files: ["**/*.{js,cjs,mjs,ts,tsx,cts,mts}"],
        jsPlugins: ["eslint-plugin-better-tailwindcss"],
        rules: {
          "better-tailwindcss/enforce-canonical-classes": "error",
          "better-tailwindcss/no-duplicate-classes": "error",
          "better-tailwindcss/no-deprecated-classes": "error",
          "better-tailwindcss/no-unnecessary-whitespace": "error",
          "better-tailwindcss/no-unknown-classes": "error",
          "better-tailwindcss/no-conflicting-classes": "error",
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
});
