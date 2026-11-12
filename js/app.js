import { renderSections } from "./sidebar.js";
import { renderFeed, autoSize } from "./feed.js";
import { initModal } from "./modal.js";
import { initSidebar, closeDrawer } from "./sidebar.js";
import { initFeed } from "./feed.js";
import { initSettings, openSettings } from "./settings.js";

function renderAll(){
  renderSections();
  renderFeed();
}

window.__renderAll = renderAll;

initModal();
initSidebar();
initFeed();
initSettings();

document.getElementById("openSettings").addEventListener("click", () => {
  closeDrawer();
  openSettings();
});

renderAll();
autoSize();

/* Offline support. A service worker needs a secure context, and a rejected
   registration (private mode, disabled storage) must never break the app. */
const secureLocalhost = ["localhost", "127.0.0.1"].includes(location.hostname);
if ("serviceWorker" in navigator && (location.protocol === "https:" || secureLocalhost)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
