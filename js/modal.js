import { data, save } from "./store.js";
import {
  modalLayer, modalTitle, modalInput, modalDescription,
  cancelModal, confirmModal
} from "./dom.js";

let modalMode = "create";
let modalTargetId = null;

export function openModal(mode, sectionId){
  modalMode = mode;
  modalTargetId = sectionId;
  const section = data.sections.find(s => s.id === sectionId);

  if(mode === "create"){
    modalTitle.textContent = "New section";
    modalInput.classList.remove("hidden");
    modalInput.value = "";
    modalInput.placeholder = "e.g. Characters, ideas...";
    modalDescription.textContent = "Choose a name for the section.";
    modalDescription.classList.add("visible");
    confirmModal.textContent = "Create";
    confirmModal.className = "confirm";
  } else if(mode === "rename"){
    modalTitle.textContent = "Rename section";
    modalInput.classList.remove("hidden");
    modalInput.value = section ? section.name : "";
    modalInput.placeholder = "New name...";
    modalDescription.textContent = "Change the name of this section.";
    modalDescription.classList.add("visible");
    confirmModal.textContent = "Save";
    confirmModal.className = "confirm";
  } else if(mode === "delete"){
    modalTitle.textContent = "Delete section";
    modalInput.classList.add("hidden");
    modalDescription.classList.remove("visible");
    const entryCount = data.entries.filter(e => e.section === sectionId).length;
    modalDescription.textContent = entryCount > 0
      ? `Delete "${section.name}" and its ${entryCount} entry(s)?`
      : `Delete "${section.name}"?`;
    modalDescription.classList.add("visible");
    confirmModal.textContent = "Delete";
    confirmModal.className = "confirm danger-confirm";
  }

  modalLayer.classList.add("open");
  if(mode === "rename"){
    setTimeout(()=>{modalInput.focus();modalInput.select()},120);
  } else if(mode !== "delete"){
    setTimeout(()=>modalInput.focus(),120);
  }
}

export function closeModal(){
  const modal = modalLayer.querySelector(".modal");
  modal.classList.add("is-closing");
  let cleaned = false;
  function cleanup(){
    if(cleaned) return;
    cleaned = true;
    modal.classList.remove("is-closing");
    modalLayer.classList.remove("open");
  }
  modal.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, 300);
}

function confirmModalAction(){
  if(modalMode === "create"){
    const name = modalInput.value.trim();
    if(!name) return;
    const id = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") || "section";
    if(data.sections.some(s => s.id === id)) return;
    data.sections.push({id, name});
    data.active = id;
    save(); closeModal();
    window.__renderAll();
  } else if(modalMode === "rename"){
    const name = modalInput.value.trim();
    if(!name) return;
    const section = data.sections.find(s => s.id === modalTargetId);
    if(!section) return;
    section.name = name;
    save(); closeModal();
    window.__renderAll();
  } else if(modalMode === "delete"){
    closeModal();
    const sectionEl = document.querySelector(`.section-item .section[data-section="${modalTargetId}"]`)?.closest(".section-item");
    if(sectionEl){
      sectionEl.classList.add("is-exit");
      sectionEl.addEventListener("animationend", () => {
        data.entries = data.entries.filter(e => e.section !== modalTargetId);
        data.sections = data.sections.filter(s => s.id !== modalTargetId);
        if(data.active === modalTargetId) data.active = "all";
        save(); window.__renderAll();
      }, { once: true });
    } else {
      data.entries = data.entries.filter(e => e.section !== modalTargetId);
      data.sections = data.sections.filter(s => s.id !== modalTargetId);
      if(data.active === modalTargetId) data.active = "all";
      save(); window.__renderAll();
    }
  }
}

export function initModal(){
  cancelModal.addEventListener("click", closeModal);
  modalLayer.addEventListener("click", e => { if(e.target === modalLayer) closeModal() });
  confirmModal.addEventListener("click", confirmModalAction);
  modalInput.addEventListener("keydown", e => {
    if(e.key === "Enter") confirmModalAction();
    if(e.key === "Escape") closeModal();
  });
}
