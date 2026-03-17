import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPWA } from "./utils/pwa";

// PWA test (production build only):
// 1) npm run build
// 2) npm run preview
// 3) Open DevTools > Application > Service Workers / Manifest and verify installability.
// 4) In DevTools > Network, switch to Offline and reload previously visited routes.
initPWA();

createRoot(document.getElementById("root")!).render(<App />);
