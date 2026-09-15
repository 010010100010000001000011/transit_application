import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister any existing service workers left by older builds.
// Old SWs cached Supabase responses and caused endless loading on hard refresh.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((ok) => {
        if (ok) console.log("[PWA] Unregistered stale service worker");
      });
    }
  });

  // Also clear leftover caches from the old workbox supabase-cache
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (
          name.includes("supabase") ||
          name.includes("workbox") ||
          name.includes("precache")
        ) {
          caches.delete(name).then(() => {
            console.log("[PWA] Cleared cache:", name);
          });
        }
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
