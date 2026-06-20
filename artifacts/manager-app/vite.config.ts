import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false,
    },

    // ⚠️ IMPORTANT: server config ONLY for dev
    server: {
      port: 5173,
      strictPort: true,
    },

    define: {
      // prevent PORT crash in build time
      "process.env.PORT": JSON.stringify(process.env.PORT || ""),
    },
  };
});
