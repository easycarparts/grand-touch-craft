import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/** Deep links like /ppf-cost-calculator need index.html when serving static `dist/` (vite preview / some static hosts). */
function spaFallbackPlugin(): Plugin {
  return {
    name: "spa-fallback",
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const raw = req.url ?? "";
        const urlPath = raw.split("?")[0];
        if (urlPath.startsWith("/@") || urlPath.startsWith("/src") || urlPath.startsWith("/node_modules"))
          return next();
        if (urlPath.includes(".") && urlPath !== "/index.html") return next();
        req.url = "/index.html";
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [react(), spaFallbackPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
