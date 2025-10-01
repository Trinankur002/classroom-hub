import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // load .env, .env.development, etc
  const env = loadEnv(mode, process.cwd(), "");

  // ensure no trailing slash here
  const backend = env.VITE_BACKEND_API_URL.replace(/\/$/, "");

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // proxy any request starting with /api to backend
        "/api": {
          target: backend,
          changeOrigin: true,
          // strip the /api prefix before forwarding
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});
