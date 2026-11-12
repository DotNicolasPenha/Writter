import { data, save, escapeHTML } from "./store.js";
import { feedInner, sectionTitle, input, send, composer, feed } from "./dom.js";
import { renderSections } from "./sidebar.js";

export function renderFeed(){
  const active = data.active;
  const entries = active === "all"
    ? data.entries
    : data.entries.filter(e => e.section === active);

  sectionTitle.textContent = data.sections.find(s => s.id === active)?.name || "All";

  if (!entries.length){
    feedInner.innerHTML = `
      <div class="empty">
        <div>
          <p>Just write.</p>
        </div>
      </div>`;
    return;
  }

  feedInner.innerHTML = entries.map(e => `
    <article class="entry" data-id="${e.id}">
      <div class="entry-meta">
        <span class="kind">${escapeHTML(data.sections.find(s=>s.id===e.section)?.name || "All")}</span>
        <span>·</span>
        <time>${new Date(e.createdAt).toLocaleString("en-US",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</time>
      </div>
      <div class="entry-text">${escapeHTML(e.text)}</div>
      <div class="entry-actions">
        <button class="icon-btn edit-entry" title="Edit" aria-label="Edit">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="icon-btn danger delete-entry" title="Delete" aria-label="Delete">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    </article>
  `).join("");

  feedInner.querySelectorAll(".delete-entry").forEach(btn => {
    btn.addEventListener("click", () => {
      const entry = btn.closest(".entry");
      const id = entry.dataset.id;
      let removed = false;
      const finish = () => {
        if(removed) return;
        removed = true;
        data.entries = data.entries.filter(e => e.id !== id);
        save(); window.__renderAll();
      };
      entry.classList.add("is-exit");
      entry.addEventListener("animationend", finish, { once: true });
      setTimeout(finish, 400);
    });
  });

  feedInner.querySelectorAll(".edit-entry").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.closest(".entry").dataset.id;
      const entry = data.entries.find(e => e.id === id);
      if (!entry) return;
      input.value = entry.text;
      input.focus();
      autoSize();
      data.entries = data.entries.filter(e => e.id !== id);
      save(); renderSections();
    });
  });
}

export function autoSize(){
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight,180) + "px";
  const ready = input.value.trim().length > 0;
  send.classList.toggle("disabled", !ready);
}

function addEntry(){
  const text = input.value.trim();
  if (!text) return;

  const target = data.active === "all" ? "drafts" : data.active;
  if (!data.sections.some(s=>s.id===target)){
    data.sections.push({id:target,name:"Drafts"});
  }

  data.entries.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()),
    text,
    section:target,
    createdAt:new Date().toISOString()
  });

  input.value = "";
  autoSize();
  data.active = target;
  save();
  window.__renderAll();
  requestAnimationFrame(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    feed.scrollTo({top:feed.scrollHeight,behavior:reduce ? "auto" : "smooth"});
  });
}

/* Keeps the composer above the on-screen keyboard on mobile.
   Sets --kb on :root, consumed by .composer-wrap { bottom: var(--kb) }.
   iOS/Chrome leave the layout viewport alone and shrink only the visual one,
   panning it so its bottom edge sits on the keyboard: the keyboard therefore
   starts at (offsetTop + vv.height) in layout coordinates, which makes
   innerHeight - vv.height - offsetTop valid even while pinch/auto-zoomed.
   The old guard bailed out when scale > 1 and forced --kb to 0, burying the
   composer behind the keyboard exactly when zoomed. The cap only rejects
   nonsense deltas (extreme zoom), since no keyboard takes 60% of the screen. */
function initViewport(){
  if(!window.visualViewport) return;
  const vv = window.visualViewport;
  let kb = 0;

  const apply = () => {
    const root = document.documentElement;
    root.style.setProperty("--kb", kb + "px");
    // Lets css/composer.css drop the resting padding while keys are up.
    root.classList.toggle("kb-open", kb > 0);
  };
  const clear = () => { if(kb){ kb = 0; apply(); } };
  const update = () => {
    if(document.activeElement !== input){ clear(); return; }
    const delta = window.innerHeight - vv.height - vv.offsetTop;
    kb = Math.max(0, Math.min(Math.round(delta), Math.round(window.innerHeight * 0.6)));
    apply();
  };

  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
  // The keyboard resize can land before focus is committed, and focus itself
  // guarantees a value is written even when no resize event ever fires.
  input.addEventListener("focus", update);
  input.addEventListener("blur", () => setTimeout(clear, 80));
  window.addEventListener("orientationchange", clear);
}

/* The feed's bottom padding follows the composer's real height instead of
   the old magic 260px, so short screens don't scroll through dead space and
   a growing textarea still can't cover the last entry. */
function initComposerSpace(){
  const wrap = document.querySelector(".composer-wrap");
  if(!wrap) return;

  const sync = () => {
    const height = Math.round(wrap.getBoundingClientRect().height) + 24;
    document.documentElement.style.setProperty("--composer-space", height + "px");
  };

  sync();
  window.addEventListener("resize", sync);
  if(window.ResizeObserver) new ResizeObserver(sync).observe(wrap);
}

export function initFeed(){
  input.addEventListener("input",autoSize);
  input.addEventListener("keydown",e=>{
    if ((e.metaKey || e.ctrlKey) && e.key==="Enter"){
      e.preventDefault(); addEntry();
    }
  });
  composer.addEventListener("submit",e=>{e.preventDefault();addEntry()});

  window.addEventListener("keydown",e=>{
    if((e.metaKey||e.ctrlKey)&&e.key==="/"){e.preventDefault();input.focus()}
  });

  initViewport();
  initComposerSpace();
}
