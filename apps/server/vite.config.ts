import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
