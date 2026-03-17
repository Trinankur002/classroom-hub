import { registerSW } from "virtual:pwa-register";

const PWA_UPDATE_EVENT = "classroom-hub:pwa-update-available";
let swUpdater: ((reloadPage?: boolean) => Promise<void>) | null = null;

export function initPWA() {
  swUpdater = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT));
    },
    onOfflineReady() {
      // App shell and cached GET data are available offline.
      console.info("Classroom Hub is ready for offline usage.");
    },
  });

  return { updateServiceWorker: swUpdater };
}

export function getPWAUpdateEventName() {
  return PWA_UPDATE_EVENT;
}

export async function refreshPWA() {
  if (!swUpdater) return;
  await swUpdater(true);
}
