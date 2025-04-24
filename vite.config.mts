import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/node_modules/**", "**/index.ts"],
    },
    globals: true,
    restoreMocks: true,
  },
  plugins: [basicSsl({
    certDir:'./.cert',
    domains:['localhost'],
    name:'localhost'
  }), tsconfigPaths()],
});
