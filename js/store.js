import { saveState } from "./dom.js";

export const KEY = "meu-espaco-escrita-v1";

const defaultData = {
  sections: [
    {id:"all", name:"All", locked:true},
    {id:"ideas", name:"Ideas"},
    {id:"drafts", name:"Drafts"}
  ],
  active:"all",
  entries:[]
};

let data;
try { data = JSON.parse(localStorage.getItem(KEY)) || defaultData; }
catch { data = defaultData; }

export { data };

const saveSpan = saveState.querySelector(".t-text-swap");

function swapText(newText){
  if(saveSpan.textContent === newText) return;
  saveSpan.classList.add("is-exit");
  setTimeout(() => {
    saveSpan.textContent = newText;
    saveSpan.classList.remove("is-exit");
    saveSpan.classList.add("is-enter-start");
    saveSpan.offsetHeight;
    saveSpan.classList.remove("is-enter-start");
  }, 160);
}

let saveTimer;
export function save(){
  clearTimeout(saveTimer);
  swapText("Saving");
  saveTimer = setTimeout(() => {
    localStorage.setItem(KEY, JSON.stringify(data));
    swapText("Saved");
  }, 180);
}

export function escapeHTML(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
