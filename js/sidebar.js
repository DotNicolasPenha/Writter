import { data, save, escapeHTML, KEY } from "./store.js";
import { sectionList, sidebar } from "./dom.js";
import { openModal } from "./modal.js";

const backdrop = document.getElementById("sidebarBackdrop");
const toggleBtn = document.getElementById("toggleSidebar");
const menuBtn = document.getElementById("openMenu");
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
  // The drawer's own toggle is off-canvas once closed, so focus has to go
  // back to the topbar trigger or keyboard users get stranded.
  if(isMobile() && menuBtn.offsetParent !== null) menuBtn.focus();
}

export function openDrawer(){
  if(!isMobile() || sidebar.classList.contains("open")) return;
  setDrawer(true);
  syncAria();
  const first = sectionList.querySelector(".section") || toggleBtn;
  first.focus();
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
  const label = mobile
    ? (open ? "Close menu" : "Open menu")
    : "Toggle sidebar";

  // Two triggers share the same state: the topbar button (phones only) and
  // the sidebar's own toggle, which doubles as the close button in the drawer.
  for(const btn of [toggleBtn, menuBtn]){
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", label);
    btn.title = label;
  }
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

  menuBtn.addEventListener("click", () => {
    if(!isMobile()) return;
    if(sidebar.classList.contains("open")) closeDrawer();
    else openDrawer();
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
