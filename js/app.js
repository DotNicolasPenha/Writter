import { renderSections } from "./sidebar.js";
import { renderFeed, autoSize } from "./feed.js";
import { initModal } from "./modal.js";
import { initSidebar } from "./sidebar.js";
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

document.getElementById("openSettings").addEventListener("click", openSettings);

renderAll();
autoSize();
