import { fileURLToPath, URL } from "node:url";

import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";
import remarkFrontmatter from "remark-frontmatter";

export default defineConfig({
  plugins: [mdx({ remarkPlugins: [remarkFrontmatter] }), react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    coverage: { reporter: ["text", "html"] },
  },
});
