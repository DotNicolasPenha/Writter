import { data, save, escapeHTML, KEY } from "./store.js";
import { sectionList, sidebar } from "./dom.js";
import { openModal } from "./modal.js";

export function renderSections(){
  sectionList.innerHTML = data.sections.map(s => {
    const count = s.id === "all" ? data.entries.length : data.entries.filter(e => e.section === s.id).length;
    const actions = s.locked ? '' : `
      <div class="section-actions">
        <button class="section-btn edit-section" data-id="${s.id}" title="Rename" aria-label="Rename section">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="section-btn danger delete-section" data-id="${s.id}" title="Delete" aria-label="Delete section">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>`;
    return `<div class="section-item">
      <button class="section ${s.id === data.active ? "active":""}" data-section="${s.id}" title="${escapeHTML(s.name)}">
        <span class="section-name">${escapeHTML(s.name)}</span>
        <span class="section-count">${count || ""}</span>
      </button>
      ${actions}
    </div>`;
  }).join("");

  sectionList.querySelectorAll(".section").forEach(btn => {
    btn.addEventListener("click", () => {
      data.active = btn.dataset.section;
      save();
      window.__renderAll();
    });
  });

  sectionList.querySelectorAll(".edit-section").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal("rename", btn.dataset.id);
    });
  });

  sectionList.querySelectorAll(".delete-section").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal("delete", btn.dataset.id);
    });
  });
}

export function initSidebar(){
  document.getElementById("toggleSidebar").addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    localStorage.setItem(KEY+"-sidebar", sidebar.classList.contains("collapsed") ? "1" : "0");
  });

  if (localStorage.getItem(KEY+"-sidebar")==="1") sidebar.classList.add("collapsed");

  document.getElementById("newSection").addEventListener("click",()=>{
    openModal("create");
  });
}
