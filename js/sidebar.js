import { data, save, escapeHTML, KEY } from "./store.js";
import { sectionList, sidebar } from "./dom.js";
import { openModal } from "./modal.js";

const backdrop = document.getElementById("sidebarBackdrop");
const toggleBtn = document.getElementById("toggleSidebar");
const mobileMQ = window.matchMedia("(max-width: 680px)");

const isMobile = () => mobileMQ.matches;

function setDrawer(open){
  sidebar.classList.toggle("open", open);
  backdrop.classList.toggle("show", open);
}

export function closeDrawer(){
  if(!sidebar.classList.contains("open")) return;
  setDrawer(false);
  syncAria();
}

function setCollapsed(collapsed){
  sidebar.classList.toggle("collapsed", collapsed);
  localStorage.setItem(KEY + "-sidebar", collapsed ? "1" : "0");
}

function syncAria(){
  const mobile = isMobile();
  const open = mobile
    ? sidebar.classList.contains("open")
    : !sidebar.classList.contains("collapsed");
  toggleBtn.setAttribute("aria-expanded", String(open));
  toggleBtn.setAttribute("aria-label", mobile
    ? (open ? "Close menu" : "Open menu")
    : "Toggle sidebar");
  toggleBtn.title = toggleBtn.getAttribute("aria-label");
}

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
      if(isMobile()) closeDrawer();
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
  if (localStorage.getItem(KEY+"-sidebar")==="1") sidebar.classList.add("collapsed");

  toggleBtn.addEventListener("click", () => {
    if(isMobile()){
      setDrawer(!sidebar.classList.contains("open"));
    } else {
      setCollapsed(!sidebar.classList.contains("collapsed"));
    }
    syncAria();
  });

  backdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", e => {
    if(e.key === "Escape") closeDrawer();
  });

  document.getElementById("newSection").addEventListener("click",()=>{
    closeDrawer();
    openModal("create");
  });

  const onBreakpoint = () => { closeDrawer(); syncAria(); };
  if(mobileMQ.addEventListener) mobileMQ.addEventListener("change", onBreakpoint);
  else if(mobileMQ.addListener) mobileMQ.addListener(onBreakpoint);

  syncAria();
}
