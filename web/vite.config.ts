import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
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
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        includeAssets: ["apple-touch-icon.png"],
        manifest: {
          id: "/",
          name: "Classroom Hub",
          short_name: "ClassHub",
          description: "Online Classroom Platform",
          theme_color: "#2563eb",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          // Replace placeholder icons in /public with real production assets:
          // pwa-192.png => 192x192, pwa-512.png => 512x512, apple-touch-icon.png => 180x180+.
          icons: [
            {
              src: "/pwa-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});
