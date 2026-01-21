import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    port: 3007,
    host: true,
  },
  resolve: {
    alias: {
      "@repo/design-system": path.resolve(__dirname, "../../packages/design-system"),
      "@repo/auth": path.resolve(__dirname, "../../packages/auth"),
      "@repo/database": path.resolve(__dirname, "../../packages/database"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
