import { KEY } from "./store.js";

const STORAGE_KEY = KEY + "-settings";

/* ── Default values (must match variables.css) ── */
const defaults = {
  bg: "#f5f5f7",
  paper: "#ffffff",
  ink: "#1d1d1f",
  muted: "#86868b",
  line: "#dedee3",
  danger: "#ff3b30",
  accent: "#1d1d1f",
  fontFamily: '"Lora", sans-serif',
  spaceScale: 1,
  radiusScale: 1,
  sidebarW: 240,
  inputH: 40,
};

/* ── Original spacing/radius values for scaling ── */
const baseSpace = {
  "--space-1": 4, "--space-2": 8, "--space-3": 12, "--space-4": 16,
  "--space-5": 20, "--space-6": 24, "--space-7": 32, "--space-8": 40,
};
const baseRadius = {
  "--radius-xs": 6, "--radius-sm": 8, "--radius-md": 12,
  "--radius-lg": 16, "--radius-xl": 20,
};

/* ══════════════════════════════════════════════
   SETTINGS CONFIG — edit this to add/remove settings
   ══════════════════════════════════════════════ */
const settingsConfig = [
  {
    section: "Appearance",
    fields: [
      {
        id: "setFont", label: "Font", type: "select",
        settingsKey: "fontFamily",
        options: [
          { value: '"Lora", sans-serif', label: "Lora" },
          { value: '"Poppins", sans-serif', label: "Poppins" },
          { value: '"Comic Relief", system-ui', label: "Comic" },
          { value: '"Huninn", sans-serif', label: "Huninn" },
          { value: "system-ui, sans-serif", label: "System UI" },
          { value: "Georgia, serif", label: "Georgia" },
        ],
      },
      { id: "setBg", label: "Background color", type: "color", settingsKey: "bg" },
      { id: "setPaper", label: "Paper color", type: "color", settingsKey: "paper" },
      { id: "setInk", label: "Text color", type: "color", settingsKey: "ink" },
      { id: "setMuted", label: "Muted color", type: "color", settingsKey: "muted" },
      { id: "setLine", label: "Border color", type: "color", settingsKey: "line" },
      { id: "setDanger", label: "Danger color", type: "color", settingsKey: "danger" },
      { id: "setAccent", label: "Accent color", type: "color", settingsKey: "accent" },
    ],
  },
  {
    section: "Dimensions",
    desc: 'Use <span class="material-symbols-outlined settings-icon-inline">arrow_upward</span><span class="material-symbols-outlined settings-icon-inline">arrow_downward</span> arrows to adjust values.',
    fields: [
      { id: "setSpace", label: "Spacing", type: "number", settingsKey: "spaceScale", min: 50, max: 150, default: 100, unit: "%", to: v => v / 100, from: v => Math.round(v * 100) },
      { id: "setRadius", label: "Border radius", type: "number", settingsKey: "radiusScale", min: 0, max: 200, default: 100, unit: "%", to: v => v / 100, from: v => Math.round(v * 100) },
      { id: "setSidebarW", label: "Sidebar width", type: "number", settingsKey: "sidebarW", min: 160, max: 320, step: 10, default: 240, unit: "px" },
      { id: "setInputH", label: "Input height", type: "number", settingsKey: "inputH", min: 28, max: 56, step: 2, default: 40, unit: "px" },
    ],
  },
];

/* ── Load / Save ── */
let settings;
try {
  settings = { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
} catch {
  settings = { ...defaults };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/* ── Apply to DOM ── */
const themeMeta = document.querySelector('meta[name="theme-color"]');

function apply() {
  const r = document.documentElement.style;
  r.setProperty("--bg", settings.bg);
  r.setProperty("--paper", settings.paper);
  r.setProperty("--ink", settings.ink);
  r.setProperty("--muted", settings.muted);
  r.setProperty("--line", settings.line);
  r.setProperty("--danger", settings.danger);
  r.setProperty("--accent", settings.accent);
  r.setProperty("--font-body", settings.fontFamily);
  r.setProperty("--sidebar-w", settings.sidebarW + "px");
  r.setProperty("--input-h", settings.inputH + "px");

  for (const [k, v] of Object.entries(baseSpace)) {
    r.setProperty(k, Math.round(v * settings.spaceScale) + "px");
  }
  for (const [k, v] of Object.entries(baseRadius)) {
    r.setProperty(k, Math.round(v * settings.radiusScale) + "px");
  }

  // The installed app paints its status bar with this colour, so it has to
  // follow the user's background instead of staying at the default #f5f5f7.
  if (themeMeta) themeMeta.setAttribute("content", settings.bg);
}

apply();

/* ══════════════════════════════════════════════
   RENDER — generates settings UI from config
   ══════════════════════════════════════════════ */
const allInputs = [];

function renderField(field) {
  if (field.type === "select") {
    const options = field.options.map(o =>
      `<option value="${o.value}">${o.label}</option>`
    ).join("");
    return `<select class="settings-select" id="${field.id}">${options}</select>`;
  }

  if (field.type === "color") {
    return `<div class="settings-color"><input type="color" id="${field.id}" value="${defaults[field.settingsKey]}"></div>`;
  }

  if (field.type === "number") {
    const step = field.step || 1;
    return `<input class="settings-number" type="number" id="${field.id}" min="${field.min}" max="${field.max}" step="${step}" value="${field.default}">`;
  }

  return "";
}

function renderSettings() {
  const body = document.querySelector(".settings-body");

  body.innerHTML = settingsConfig.map(section => {
    const desc = section.desc
      ? `<p class="settings-section-desc">${section.desc}</p>`
      : "";

    const fields = section.fields.map(field => {
      const errHtml = field.type === "number"
        ? `<p class="settings-error" id="err${field.id.replace("set","")}"></p>`
        : "";
      return `
        <div class="settings-row">
          <span class="settings-label">${field.label}</span>
          ${renderField(field)}
        </div>
        ${errHtml}`;
    }).join("");

    return `
      <div class="settings-section">
        <p class="settings-section-title">${section.section}</p>
        ${desc}
        ${fields}
      </div>`;
  }).join("");

  /* collect all input elements */
  allInputs.length = 0;
  settingsConfig.forEach(s => s.fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) allInputs.push({ el, field: f });
  }));
}

renderSettings();

/* ── Resolve element refs ── */
const layer = document.getElementById("settingsLayer");
const closeBtn = document.getElementById("settingsClose");
const resetBtn = document.getElementById("settingsReset");
const saveBtn = document.getElementById("settingsSaveBtn");

/* ── Sync UI ← settings ── */
function syncUI() {
  allInputs.forEach(({ el, field }) => {
    const raw = settings[field.settingsKey];
    el.value = field.from ? field.from(raw) : raw;
    el.classList.remove("invalid");
    const errEl = document.getElementById("err" + field.id.replace("set", ""));
    if (errEl) errEl.textContent = "";
  });
}

/* ── Validation (number only) ── */
function validateNumber(input, field) {
  const raw = input.value.trim();
  const num = Number(raw);
  const invalid = raw === "" || isNaN(num) || num < field.min || num > field.max;
  const errEl = document.getElementById("err" + field.id.replace("set", ""));

  input.classList.toggle("invalid", invalid);
  if (errEl) errEl.textContent = invalid ? `Invalid value (${field.min}–${field.max})` : "";

  if (invalid) {
    input.value = field.default;
    return field.default;
  }
  return num;
}

/* ── Live preview ── */
function preview() {
  allInputs.forEach(({ el, field }) => {
    if (field.type === "select" || field.type === "color") {
      settings[field.settingsKey] = el.value;
    } else if (field.type === "number") {
      const val = validateNumber(el, field);
      settings[field.settingsKey] = field.to ? field.to(val) : val;
    }
  });
  apply();
}

/* ── Open / Close ── */
export function openSettings() {
  syncUI();
  layer.classList.add("open");
}

function closeSettings() {
  const modal = layer.querySelector(".settings");
  modal.classList.add("is-closing");
  let cleaned = false;
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    modal.classList.remove("is-closing");
    layer.classList.remove("open");
    apply();
  }
  modal.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, 300);
}

/* ── Events ── */
closeBtn.addEventListener("click", closeSettings);
layer.addEventListener("click", (e) => { if (e.target === layer) closeSettings(); });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && layer.classList.contains("open")) {
    e.stopPropagation();
    closeSettings();
  }
});

allInputs.forEach(({ el }) => el.addEventListener("input", preview));

resetBtn.addEventListener("click", () => {
  Object.assign(settings, { ...defaults });
  localStorage.removeItem(STORAGE_KEY);
  syncUI();
  apply();
});

saveBtn.addEventListener("click", () => {
  save();
  closeSettings();
});

export function initSettings() {}
