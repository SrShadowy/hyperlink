/* ============================================================
   editor.js — Editor de Perfil Linktree Custom
   ============================================================ */

const DATA_JSON_PATH   = "./resources/data.json";
const LOCAL_STORAGE_KEY = "hyperlink-editor";

/* ============================================================
   ÍCONES FA DISPONÍVEIS
   ============================================================ */
const FA_ICONS = [
  { l:"Instagram",  v:"fab fa-instagram",  i:"fab fa-instagram"  },
  { l:"Twitter/X",  v:"fab fa-x-twitter",  i:"fab fa-x-twitter"  },
  { l:"Twitch",     v:"fab fa-twitch",      i:"fab fa-twitch"     },
  { l:"YouTube",    v:"fab fa-youtube",     i:"fab fa-youtube"    },
  { l:"Discord",    v:"fab fa-discord",     i:"fab fa-discord"    },
  { l:"TikTok",     v:"fab fa-tiktok",      i:"fab fa-tiktok"     },
  { l:"GitHub",     v:"fab fa-github",      i:"fab fa-github"     },
  { l:"LinkedIn",   v:"fab fa-linkedin",    i:"fab fa-linkedin"   },
  { l:"Spotify",    v:"fab fa-spotify",     i:"fab fa-spotify"    },
  { l:"Reddit",     v:"fab fa-reddit",      i:"fab fa-reddit"     },
  { l:"Facebook",   v:"fab fa-facebook",    i:"fab fa-facebook"   },
  { l:"Link",       v:"fas fa-link",        i:"fas fa-link"       },
  { l:"Livro/Guia", v:"fas fa-book",        i:"fas fa-book"       },
  { l:"Vídeo",      v:"fas fa-video",       i:"fas fa-video"      },
  { l:"Gamepad",    v:"fas fa-gamepad",     i:"fas fa-gamepad"    },
  { l:"Star",       v:"fas fa-star",        i:"fas fa-star"       },
];

/* ============================================================
   CACHE base64 de imagens carregadas localmente
   ============================================================ */
const localImageCache = {};

/* ============================================================
   TABS
   ============================================================ */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("sec-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "json") gerarJSON();
  });
});

/* ============================================================
   PANEL RESIZER — arrastar para ajustar largura
   ============================================================ */
let isResizing = false;
let startX, startWidthPreview, startWidthEditor;

const resizer = document.getElementById('panel-resizer');
const previewPanel = document.querySelector('.preview-panel');
const editorPanel = document.querySelector('.editor-panel');

resizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  startX = e.clientX;
  startWidthPreview = previewPanel.offsetWidth;
  startWidthEditor = editorPanel.offsetWidth;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;

  const deltaX = e.clientX - startX;
  const newPreviewWidth = Math.max(320, Math.min(startWidthPreview + deltaX, window.innerWidth - 400));
  const newEditorWidth = Math.max(400, window.innerWidth - newPreviewWidth - resizer.offsetWidth);

  previewPanel.style.width = newPreviewWidth + 'px';
  editorPanel.style.width = newEditorWidth + 'px';
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

/* ============================================================
   PREVIEW — tema toggle
   ============================================================ */
let previewTheme = "dark";
document.getElementById("preview-theme-btn").addEventListener("click", () => {
  const root = document.getElementById("preview-root");
  previewTheme = previewTheme === "dark" ? "light" : "dark";
  root.classList.toggle("dark-theme",  previewTheme === "dark");
  root.classList.toggle("light-theme", previewTheme === "light");
  document.getElementById("preview-theme-btn").innerHTML =
    previewTheme === "dark" ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});

/* ============================================================
   HELPERS — ícone com cor e tamanho
   Formato no JSON:
     FA sem customização  →  "fab fa-discord"
     FA com cor/tamanho   →  "fab fa-discord" style="color:rgb(x,y,z);font-size:16px;"
     Imagem               →  "meuicone.png"   (só nome, sem style)
   ============================================================ */
function isFaIcon(val) { return (val||"").trim().startsWith("fa"); }

/** Extrai classe FA, cor e fontSize de um valor raw do JSON */
function parseIconValue(raw) {
  if (!raw) return { faClass:"", iconColor:"", fontSize:"" };
  const styleMatch  = raw.match(/style\s*=\s*["']([^"']*)/);
  const styleStr    = styleMatch ? styleMatch[1] : "";
  const colorMatch  = styleStr.match(/color:\s*([^;]+)/);
  const sizeMatch   = styleStr.match(/font-size:\s*([^;]+)/);
  const faClass     = raw.replace(/["']\s*style=.*$/, "").trim();
  return {
    faClass,
    iconColor: colorMatch ? colorMatch[1].trim() : "",
    fontSize:  sizeMatch  ? sizeMatch[1].trim().replace("px","") : "",
  };
}

/** Monta valor do ícone para o JSON */
function buildIconValue(faClass, iconColor, fontSize) {
  if (!faClass) return "";
  const parts = [];
  if (iconColor) parts.push(`color: ${iconColor};`);
  if (fontSize)  parts.push(`font-size: ${fontSize}px;`);
  if (!parts.length) return faClass;
  return `${faClass}" style="${parts.join(" ")}`;
}

/** Lê os campos de styling de um bloco (link, sublink ou pasta) */
function readStyleFields(prefix) {
  const iconInput  = document.getElementById(prefix + "-i");
  const iconColorEl = document.getElementById(prefix + "-ic");
  const textColorEl = document.getElementById(prefix + "-tc");
  const fontSizeEl  = document.getElementById(prefix + "-fs");

  const rawIcon  = iconInput?.value.trim() || "";
  const textColor = textColorEl?.dataset.cleared === "true" ? "" : (textColorEl?.value !== "#ffffff" ? hexToRgb(textColorEl?.value||"") : "");
  const fontSize  = fontSizeEl?.value.trim() || "";

  let iconVal = rawIcon;
  if (isFaIcon(rawIcon) && iconColorEl) {
    const ic = iconColorEl.dataset.cleared === "true" ? "" : (iconColorEl.value !== "#ffffff" ? hexToRgb(iconColorEl.value) : "");
    iconVal = buildIconValue(rawIcon, ic, fontSize);
  }

  return { icon: iconVal, textColor, fontSize };
}

/* ============================================================
   HELPER — Color picker row HTML
   type: "icon" | "text"
   ============================================================ */
function colorPickerHTML(fieldId, label, currentColor = "") {
  const hex = colorToHex(currentColor) || "#ffffff";
  const isDefault = !currentColor;
  return `
    <div class="color-picker-row">
      <span class="cpick-label">${label}</span>
      <input type="color" id="${fieldId}" class="color-swatch" value="${hex}"
             ${isDefault ? '' : ''}>
      <span class="color-value-label" id="${fieldId}-lbl">${currentColor || "padrão"}</span>
      <button class="btn btn-sm" data-clear-color="${fieldId}" title="Remover cor">
        <i class="fas fa-xmark"></i>
      </button>
    </div>`;
}

/* Delegação global para botões de limpar cor */
document.body.addEventListener("click", e => {
  const clearTarget = e.target.closest("[data-clear-color]")?.dataset.clearColor;
  if (clearTarget) {
    const el = document.getElementById(clearTarget);
    if (!el) return;
    el.value = "#ffffff";
    el.dataset.cleared = "true";
    const lbl = document.getElementById(clearTarget + "-lbl");
    if (lbl) lbl.textContent = "padrão";
    debouncedSave(); debouncedUpdatePreview();
  }
});

/* Sync label ao mover qualquer color swatch */
document.body.addEventListener("input", e => {
  if (e.target.classList.contains("color-swatch")) {
    const lbl = document.getElementById(e.target.id + "-lbl");
    if (lbl) lbl.textContent = hexToRgb(e.target.value);
    e.target.dataset.cleared = "false";
  }
});

/* ============================================================
   HELPER — Icon Picker HTML  (com botão de arquivo)
   ============================================================ */
function iconPickerHTML(fieldId, currentValue = "") {
  const esc = v => (v||"").replace(/"/g,"&quot;");
  const fileId  = fieldId + "-file";
  const thumbId = fieldId + "-thumb";
  return `
    <div class="icon-picker-wrap" data-picker-id="${fieldId}">
      <div class="icon-input-row">
        <input id="${fieldId}" type="text" value="${esc(currentValue)}"
               placeholder="fab fa-discord  ou  nome-do-arquivo.png">
        <label class="btn btn-file" for="${fileId}" title="Escolher imagem do computador">
          <i class="fas fa-ellipsis"></i>
        </label>
        <input type="file" id="${fileId}" accept="image/*" style="display:none"
               data-target="${fieldId}" data-thumb="${thumbId}">
      </div>
      <div id="${thumbId}" class="icon-thumb-wrap" style="display:none">
        <img class="icon-thumb-img" src="" alt="">
        <div class="icon-thumb-notice">
          <i class="fas fa-triangle-exclamation"></i>
          Copie este arquivo para <code>resources/icons/</code>
        </div>
      </div>
      <p class="icon-section-label">Font Awesome:</p>
      <div class="icon-grid">
        ${FA_ICONS.map(i =>
          `<span class="icon-opt${currentValue===i.v?" sel":""}"
               data-target="${fieldId}" data-value="${i.v}">
             <i class="${i.i}"></i>${i.l}
           </span>`
        ).join("")}
      </div>
    </div>`;
}

/* ============================================================
   HELPER — Bloco de estilo (ícone + cor do ícone + cor do texto + font size)
   Usado em: sublinks, links diretos, pastas
   ============================================================ */
function styleBlockHTML(prefix, data = {}) {
  // data pode ter: icon, iconColor, textColor, fontSize
  const { faClass, iconColor, fontSize } = parseIconValue(data.icon || "");
  const textColor = data.textColor || "";
  const fs = data.fontSize || fontSize || "";
  const isIconFA = isFaIcon(faClass || data.icon || "");

  return `
    <div class="style-block">
      <div class="field-group">
        <label>Ícone</label>
        ${iconPickerHTML(prefix + "-i", faClass || data.icon || "")}
      </div>
      <div class="style-extra" id="${prefix}-extras" style="display:${isIconFA ? 'block':'none'}">
        <div class="field-group">
          <label>Cor do ícone</label>
          ${colorPickerHTML(prefix + "-ic", "<i class='fas fa-palette'></i> Ícone", iconColor)}
        </div>
      </div>
      <div class="field-group">
        <label>Cor do texto</label>
        ${colorPickerHTML(prefix + "-tc", "<i class='fas fa-font'></i> Texto", textColor)}
      </div>
      <div class="field-group">
        <label>Tamanho da fonte <span class="hint" style="display:inline">px — deixe vazio para padrão</span></label>
        <input id="${prefix}-fs" type="number" value="${fs}" min="8" max="72" placeholder="14">
      </div>
    </div>`;
}

/* Mostra/esconde cor do ícone conforme tipo de ícone */
document.body.addEventListener("input", e => {
  if (!e.target.classList.contains("icon-picker-wrap input") && e.target.closest(".icon-picker-wrap")) {
    const wrap   = e.target.closest(".icon-picker-wrap");
    const prefix = wrap?.dataset.pickerId?.replace(/-i$/, "");
    if (!prefix) return;
    const extras = document.getElementById(prefix + "-extras");
    if (extras) extras.style.display = isFaIcon(e.target.value) ? "block" : "none";
  }
});

/* ============================================================
   Upload de imagem local → base64 cache, nome no input
   ============================================================ */
document.body.addEventListener("change", e => {
  const fileInput = e.target.closest("input[type='file'][data-target]");
  if (!fileInput) return;
  const file = fileInput.files[0];
  if (!file) return;

  const targetId  = fileInput.dataset.target;
  const thumbId   = fileInput.dataset.thumb;
  const textInput = document.getElementById(targetId);
  const thumbWrap = document.getElementById(thumbId);
  if (!textInput) return;

  textInput.value = file.name;
  textInput.closest(".icon-picker-wrap")?.querySelectorAll(".icon-opt").forEach(o => o.classList.remove("sel"));

  // Esconde cor do ícone (é imagem, não FA)
  const prefix = targetId.replace(/-i$/, "");
  const extras = document.getElementById(prefix + "-extras");
  if (extras) extras.style.display = "none";

  const reader = new FileReader();
  reader.onload = ev => {
    localImageCache[file.name] = ev.target.result;
    if (thumbWrap) {
      const img = thumbWrap.querySelector(".icon-thumb-img");
      if (img) img.src = ev.target.result;
      thumbWrap.style.display = "flex";
    }
    debouncedSave(); debouncedUpdatePreview();
  };
  reader.readAsDataURL(file);
});

/* ============================================================
   EVENT DELEGATION — cliques gerais
   ============================================================ */
document.body.addEventListener("click", e => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "collapse") {
    const card = e.target.closest(".folder-card, .card[id^='dl-']");
    if (!card) return;
    card.classList.toggle("collapsed");
    const icon = e.target.closest("[data-action='collapse']").querySelector("i");
    if (icon) { icon.classList.toggle("fa-caret-up"); icon.classList.toggle("fa-caret-down"); }
    return;
  }

  if (action === "move-up" || action === "move-down") {
    const item = e.target.closest(".card, .folder-card, .link-row");
    if (!item) return;
    moveElement(item, action === "move-up" ? "up" : "down");
    debouncedSave(); debouncedUpdatePreview();
    return;
  }

  if (["remove-rede","remove-pasta","remove-sublink","remove-directlink"].includes(action)) {
    e.target.closest(".card, .folder-card, .link-row").remove();
    debouncedSave(); debouncedUpdatePreview();
    return;
  }

  if (action === "add-sublink") {
    const pastaId = e.target.closest("[data-action]").dataset.pastaId;
    addSubLink(pastaId);
    debouncedSave(); debouncedUpdatePreview();
    return;
  }

  // Icon picker — clique num ícone FA rápido
  const opt = e.target.closest(".icon-grid [data-target]");
  if (opt) {
    const input = document.getElementById(opt.dataset.target);
    if (!input) return;
    input.value = opt.dataset.value;
    opt.closest(".icon-grid").querySelectorAll(".icon-opt").forEach(o => o.classList.remove("sel"));
    opt.classList.add("sel");

    // Mostra/esconde extras de cor do ícone
    const prefix = opt.dataset.target.replace(/-i$/, "");
    const extras = document.getElementById(prefix + "-extras");
    if (extras) extras.style.display = isFaIcon(opt.dataset.value) ? "block" : "none";

    debouncedSave(); debouncedUpdatePreview();
  }
});

/* Atualiza título da pasta ao digitar */
document.body.addEventListener("input", e => {
  if (e.target.id?.startsWith("pn-")) {
    const folder = e.target.closest(".folder-card");
    const title  = folder?.querySelector(".folder-title");
    if (title) title.textContent = e.target.value || "Nova Pasta";
  }
});

/* Dispara preview + save em qualquer input/change */
document.body.addEventListener("input",  () => { debouncedSave(); debouncedUpdatePreview(); });
document.body.addEventListener("change", () => { debouncedSave(); debouncedUpdatePreview(); });

/* ============================================================
   FOTO PREVIEW (miniatura no campo de perfil)
   ============================================================ */
document.getElementById("p-foto").addEventListener("input", function () {
  const img = document.getElementById("foto-preview");
  if (this.value) { img.src = this.value; img.style.display = "block"; }
  else              { img.style.display = "none"; }
});
document.getElementById("p-bg").addEventListener("input", function () {
  const img = document.getElementById("bg-preview");
  if (this.value) { img.src = this.value; img.style.display = "block"; }
  else              { img.style.display = "none"; }
});

/* ============================================================
   MOVER ELEMENTOS
   ============================================================ */
function moveElement(el, direction) {
  const parent = el.parentElement;
  if (direction === "up"   && el.previousElementSibling) parent.insertBefore(el, el.previousElementSibling);
  if (direction === "down" && el.nextElementSibling)     parent.insertBefore(el.nextElementSibling, el);
}

/* ============================================================
   REDES SOCIAIS
   ============================================================ */
document.getElementById("btn-add-rede").addEventListener("click", () => addRede());

function addRede(data = {}) {
  const id = generateId();
  const div = document.createElement("div");
  div.className = "card";
  div.id = `rede-${id}`;

  const { faClass: iconClass, iconColor } = parseIconValue(data.icon || "");

  div.innerHTML = `
    <div class="two-col">
      <div class="field-group">
        <label>Nome</label>
        <input id="rn-${id}" type="text" value="${escapeHTML(data.nome)}" placeholder="Instagram">
      </div>
      <div class="field-group">
        <label>URL</label>
        <input id="ru-${id}" type="url" value="${escapeHTML(data.url)}" placeholder="https://instagram.com/...">
      </div>
    </div>
    <div class="field-group">
      <label>Ícone</label>
      ${iconPickerHTML("ri-" + id, iconClass)}
    </div>
    <div class="field-group color-picker-group" id="rcolor-group-${id}" style="display:${isFaIcon(iconClass)?'block':'none'}">
      <label>Cor do ícone</label>
      ${colorPickerHTML("rc-" + id, "<i class='fas fa-palette'></i> Ícone", iconColor)}
    </div>
    <div class="flex-end">
      <button class="btn" data-action="move-up"><i class="fas fa-arrow-up"></i></button>
      <button class="btn" data-action="move-down"><i class="fas fa-arrow-down"></i></button>
      <button class="btn btn-danger" data-action="remove-rede"><i class="fas fa-trash"></i> Remover</button>
    </div>`;
  document.getElementById("redes-list").appendChild(div);

  // Mostra/esconde cor quando ícone muda
  document.getElementById("ri-" + id).addEventListener("input", function() {
    document.getElementById("rcolor-group-" + id).style.display = isFaIcon(this.value) ? "block" : "none";
  });
}

/* ============================================================
   PASTAS
   Lista unificada: pastas E links diretos ficam no mesmo
   container (#items-list) para poder reordenar entre si.
   ============================================================ */
document.getElementById("btn-add-pasta").addEventListener("click", () => addPasta());
document.getElementById("btn-add-dl").addEventListener("click",    () => addDirectLink());

function addPasta(data = {}) {
  const id  = generateId();
  const div = document.createElement("div");
  div.className = "folder-card";
  div.id = `pasta-${id}`;
  div.dataset.type = "pasta";

  // Estilo da pasta (cor do texto, ícone com cor, font-size)
  const { faClass: pIconClass, iconColor: pIconColor, fontSize: pFontSize } = parseIconValue(data.icon || data.Icon || "");
  // Fallback para iconColor direto (novo modelo)
  const pIconColorVal = data.iconColor || pIconColor || "";
  const pTextColor = data.textColor || "";

  div.innerHTML = `
    <div class="folder-header">
      <div class="folder-controls">
        <button class="btn" data-action="collapse" title="Colapsar"><i class="fas fa-caret-up"></i></button>
        <button class="btn" data-action="move-up"><i class="fas fa-arrow-up"></i></button>
        <button class="btn" data-action="move-down"><i class="fas fa-arrow-down"></i></button>
      </div>
      <div class="folder-title">${escapeHTML(data.nome || "Nova Pasta")}</div>
      <button class="btn btn-danger" data-action="remove-pasta" style="margin-left:auto">
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <div class="folder-body">
      <div class="two-col">
        <div class="field-group">
          <label>Nome da Pasta</label>
          <input id="pn-${id}" type="text" value="${escapeHTML(data.nome)}" placeholder="Monster Hunter Wilds">
        </div>
        <div class="field-group">
          <label>Tópico</label>
          <input id="pt-${id}" type="text" value="${escapeHTML(data.topic)}" placeholder="Guia de Progressão">
        </div>
      </div>

      <div class="style-block">
        <div class="field-group">
          <label>Ícone da Pasta <span class="hint" style="display:inline">— arquivo em resources/icons/ ou classe FA</span></label>
          ${iconPickerHTML("pi-" + id, pIconClass || data.icon || data.Icon || "")}
        </div>
        <div class="style-extra" id="pi-${id}-extras" style="display:${isFaIcon(pIconClass||data.icon||data.Icon||"")?'block':'none'}">
          <div class="field-group">
            <label>Cor do ícone</label>
            ${colorPickerHTML("pi-" + id + "-ic", "<i class='fas fa-palette'></i> Ícone", pIconColorVal)}
          </div>
        </div>
        <div class="field-group">
          <label>Cor do texto</label>
          ${colorPickerHTML("p-" + id + "-tc", "<i class='fas fa-font'></i> Texto", pTextColor)}
        </div>
        <div class="field-group">
          <label>Tamanho da fonte <span class="hint" style="display:inline">px</span></label>
          <input id="p-${id}-fs" type="number" value="${escapeHTML(pFontSize||data.fontSize||"")}" min="8" max="72" placeholder="14">
        </div>
      </div>

      <p class="sub-title">Links dentro desta pasta</p>
      <div id="slinks-${id}"></div>
      <div class="flex-end">
        <button class="btn btn-add" data-action="add-sublink" data-pasta-id="${id}">
          <i class="fas fa-plus"></i> Adicionar link
        </button>
      </div>
    </div>`;

   // document.getElementById("items-list").appendChild(div);
  document.getElementById("pastas-list").appendChild(div);
  (data.links || []).forEach(l => addSubLink(id, l));
}

function addSubLink(pid, data = {}) {
  const sid = generateId();
  const uid = `sl-${pid}-${sid}`;
  const div = document.createElement("div");
  div.className = "link-row";
  div.id = uid;

  const { faClass, iconColor, fontSize } = parseIconValue(data.icon || "");
  const textColor = data.textColor || "";

  div.innerHTML = `
    <div class="link-row-header">
      <div class="link-row-controls">
        <button class="btn" data-action="collapse" title="Colapsar"><i class="fas fa-caret-up"></i></button>
        <button class="btn" data-action="move-up"><i class="fas fa-arrow-up"></i></button>
        <button class="btn" data-action="move-down"><i class="fas fa-arrow-down"></i></button>
      </div>
      <span class="link-row-title">${escapeHTML(data.nome || "Novo Link")}</span>
      <button class="btn btn-danger" data-action="remove-sublink" style="margin-left:auto">
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <div class="link-row-body">
      <div class="two-col">
        <div class="field-group">
          <label>Nome</label>
          <input id="${uid}-n" type="text" value="${escapeHTML(data.nome)}" placeholder="Great Sword">
        </div>
        <div class="field-group">
          <label>URL</label>
          <input id="${uid}-u" type="url" value="${escapeHTML(data.url)}" placeholder="https://...">
        </div>
      </div>
      ${styleBlockHTML(uid, { icon: faClass||data.icon||"", iconColor, textColor, fontSize })}
    </div>`;

  document.getElementById(`slinks-${pid}`).appendChild(div);

  // Atualiza título do link ao digitar
  document.getElementById(uid + "-n")?.addEventListener("input", function() {
    const title = div.querySelector(".link-row-title");
    if (title) title.textContent = this.value || "Novo Link";
  });
}

/* ============================================================
   LINKS DIRETOS
   ============================================================ */
function addDirectLink(data = {}) {
  const id  = generateId();
  const div = document.createElement("div");
  div.className = "card";
  div.id = `dl-${id}`;
  div.dataset.type = "directlink";

  const { faClass, iconColor, fontSize } = parseIconValue(data.icon || "");
  const textColor = data.textColor || "";
  // Fallback para iconColor direto (novo modelo)
  const iconColorVal = data.iconColor || iconColor || "";

  div.innerHTML = `
    <div class="folder-header">
      <div class="folder-controls">
        <button class="btn" data-action="collapse" title="Colapsar"><i class="fas fa-caret-up"></i></button>
        <button class="btn" data-action="move-up"><i class="fas fa-arrow-up"></i></button>
        <button class="btn" data-action="move-down"><i class="fas fa-arrow-down"></i></button>
      </div>
      <div class="folder-title">${escapeHTML(data.nome || "Novo Link Direto")}</div>
      <button class="btn btn-danger" data-action="remove-directlink" style="margin-left:auto">
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <div class="folder-body">
      <div class="two-col">
        <div class="field-group">
          <label>Nome</label>
          <input id="dln-${id}" type="text" value="${escapeHTML(data.nome)}" placeholder="Discord Oficial">
        </div>
        <div class="field-group">
          <label>Tópico</label>
          <input id="dlt-${id}" type="text" value="${escapeHTML(data.topic)}" placeholder="Guia de Progressão">
        </div>
      </div>
      <div class="field-group">
        <label>URL</label>
        <input id="dlu-${id}" type="url" value="${escapeHTML(data.url)}" placeholder="https://discord.gg/...">
      </div>
      ${styleBlockHTML("dl-" + id, { icon: faClass||data.icon||"", iconColor: iconColorVal, textColor, fontSize })}
    </div>`;

    //document.getElementById("items-list").appendChild(div);
    document.getElementById("direct-links-list").appendChild(div);

  // Atualiza título ao digitar
  document.getElementById("dln-" + id)?.addEventListener("input", function() {
    const title = div.querySelector(".folder-title");
    if (title) title.textContent = this.value || "Novo Link Direto";
  });
}

/* ============================================================
   EXTRAIR COR de um campo de cor
   ============================================================ */
function readColor(id) {
  const el = document.getElementById(id);
  if (!el || el.dataset.cleared === "true" || el.value === "#ffffff") return "";
  return hexToRgb(el.value);
}

/* ============================================================
   EXTRAIR DADOS DO DOM
   ============================================================ */
function getEditorData() {
  const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };

  const profile     = get("p-foto");
  const name        = get("p-nome");
  const description = get("p-desc");
  const background  = get("p-bg");
  const theme       = get("p-theme") || "dark";

  // Redes (só ícone FA + cor do ícone)
  const redes = [];
  document.querySelectorAll("[id^='rn-']").forEach(el => {
    const id      = el.id.replace("rn-", "");
    const faClass = get("ri-" + id);
    const ic      = readColor("rc-" + id);
    const iconVal = buildIconValue(faClass, ic, "");
    const obj = { nome: get("rn-" + id), url: get("ru-" + id), icon: iconVal };
    if (obj.nome || obj.url) redes.push(obj);
  });

  // Items unificados (pastas E links diretos) - preserva a ordem do DOM
  const items = [];
  
  // Pastas
  document.querySelectorAll("[id^='pasta-']").forEach(el => {
    const id    = el.id.replace("pasta-", "");
    const links = [];

    el.querySelectorAll(`[id^='sl-${id}-'][id$='-n']`).forEach(lel => {
      const lid       = lel.id.replace("-n", "");
      const rawIcon   = get(lid + "-i");
      const ic        = readColor(lid + "-ic");
      const fs        = get(lid + "-fs");
      const iconVal   = isFaIcon(rawIcon) ? buildIconValue(rawIcon, ic, fs) : rawIcon;
      const textColor = readColor(lid + "-tc");

      const link = { nome: get(lid+"-n"), url: get(lid+"-u") };
      if (iconVal)   link.icon      = iconVal;
      if (textColor) link.textColor = textColor;
      if (fs)        link.fontSize  = fs;
      if (link.nome || link.url) links.push(link);
    });

    const rawPIcon   = get("pi-" + id);
    const pIc        = readColor("pi-" + id + "-ic");
    const pFs        = get("p-" + id + "-fs");
    const pIconVal   = isFaIcon(rawPIcon) ? buildIconValue(rawPIcon, pIc, pFs) : rawPIcon;
    const pTextColor = readColor("p-" + id + "-tc");

    const item = {
      id,
      type: "folder",
      nome:  get("pn-" + id),
      topic: get("pt-" + id),
      icon:  pIconVal,
      iconColor: pIc || "",
      textColor: pTextColor || "",
      fontSize:  pFs || "",
      links,
    };
    if (item.nome) items.push(item);
  });

  // Links diretos
  document.querySelectorAll("[id^='dl-']").forEach(el => {
    const id        = el.id.replace("dl-", "");
    const rawIcon   = get("dl-" + id + "-i");
    const ic        = readColor("dl-" + id + "-ic");
    const fs        = get("dl-" + id + "-fs");
    const iconVal   = isFaIcon(rawIcon) ? buildIconValue(rawIcon, ic, fs) : rawIcon;
    const textColor = readColor("dl-" + id + "-tc");

    const item = { 
      id,
      type: "link",
      topic: get("dlt-"+id), 
      nome: get("dln-"+id), 
      url: get("dlu-"+id),
      icon: iconVal || "",
      iconColor: ic || "",
      textColor: textColor || "",
      fontSize: fs || ""
    };
    if (item.nome || item.url) items.push(item);
  });

  return { profile, name, description, background, theme, redes, items };
}

/* ============================================================
   PREVIEW ao vivo
   ============================================================ */
function atualizarPreview() {
  const foto = document.getElementById("p-foto").value.trim();
  const pvFoto = document.getElementById("pv-foto");
  if (foto) { pvFoto.src = foto; pvFoto.style.display = "block"; }
  else        { pvFoto.style.display = "none"; }

  document.getElementById("pv-nome").textContent = document.getElementById("p-nome").value.trim();
  document.getElementById("pv-desc").textContent = document.getElementById("p-desc").value.trim();

  // Redes
  const redesEl = document.getElementById("pv-redes");
  redesEl.innerHTML = "";
  document.querySelectorAll("[id^='rn-']").forEach(el => {
    const id      = el.id.replace("rn-", "");
    const url     = document.getElementById("ru-" + id)?.value.trim() || "#";
    const faClass = document.getElementById("ri-" + id)?.value.trim() || "";
    if (!faClass) return;
    const ic      = readColor("rc-" + id);
    const a = document.createElement("a");
    a.href = url; a.target = "_blank";
    a.innerHTML = `<i class="${faClass}" style="font-size:18px;${ic ? `color:${ic};` : ""}"></i>`;
    redesEl.appendChild(a);
  });

  // Conteúdo (pastas + links diretos preservando ordem DOM)
  const conteudo = document.getElementById("pv-conteudo");
  conteudo.innerHTML = "";

  // Coleta todos os itens na ordem DOM atual
  // — pastas: #pastas-list > .folder-card
  // — links diretos: #direct-links-list > .card
  // Agrupa por tópico preservando ordem de aparição
  const topicsOrder = [];
  const topicItems  = {};   // topic → [{type:"pasta"|"link", data}]

  const pushItem = (topic, item) => {
    if (!topicItems[topic]) { topicItems[topic] = []; topicsOrder.push(topic); }
    topicItems[topic].push(item);
  };

  // Pastas
  document.querySelectorAll("#pastas-list [id^='pasta-']").forEach(el => {
    const id    = el.id.replace("pasta-", "");
    const topic = document.getElementById("pt-" + id)?.value.trim() || "";
    const nome  = document.getElementById("pn-" + id)?.value.trim() || "";
    if (!nome) return;

    const rawIcon   = document.getElementById("pi-" + id)?.value.trim() || "";
    const ic        = readColor("pi-" + id + "-ic");
    const tc        = readColor("p-" + id + "-tc");
    const fs        = document.getElementById("p-" + id + "-fs")?.value.trim() || "";

    const links = [];
    el.querySelectorAll(`[id^='sl-${id}-'][id$='-n']`).forEach(lel => {
      const lid = lel.id.replace("-n", "");
      const ln  = document.getElementById(lid+"-n")?.value.trim() || "";
      const lu  = document.getElementById(lid+"-u")?.value.trim() || "#";
      const li  = document.getElementById(lid+"-i")?.value.trim() || "";
      const lic = readColor(lid + "-ic");
      const ltc = readColor(lid + "-tc");
      const lfs = document.getElementById(lid+"-fs")?.value.trim() || "";
      if (ln) links.push({ nome:ln, url:lu, icon:li, iconColor:lic, textColor:ltc, fontSize:lfs });
    });

    pushItem(topic, { type:"pasta", nome, rawIcon, iconColor:ic, textColor:tc, fontSize:fs, links });
  });

  // Links diretos
  document.querySelectorAll("#direct-links-list [id^='dl-']").forEach(el => {
    const id    = el.id.replace("dl-", "");
    const topic = document.getElementById("dlt-" + id)?.value.trim() || "";
    const nome  = document.getElementById("dln-" + id)?.value.trim() || "";
    const url   = document.getElementById("dlu-" + id)?.value.trim() || "#";
    const li    = document.getElementById("dl-" + id + "-i")?.value.trim() || "";
    const lic   = readColor("dl-" + id + "-ic");
    const tc    = readColor("dl-" + id + "-tc");
    const fs    = document.getElementById("dl-" + id + "-fs")?.value.trim() || "";
    if (!nome) return;
    pushItem(topic, { type:"link", nome, url, icon:li, iconColor:lic, textColor:tc, fontSize:fs });
  });

  topicsOrder.forEach(topic => {
    if (!topicItems[topic]?.length) return;

    const tt = document.createElement("p");
    tt.className = "pv-topic-title";
    tt.textContent = topic;
    conteudo.appendChild(tt);

    topicItems[topic].forEach(item => {
      if (item.type === "link") {
        const div = document.createElement("div");
        div.className = "pv-link";
        const style = [];
        if (item.textColor) style.push(`color:${item.textColor}`);
        if (item.fontSize)  style.push(`font-size:${item.fontSize}px`);
        if (style.length) div.style.cssText = style.join(";");
        div.innerHTML = pvIconHTML(item.icon, item.iconColor, 14) + `<span>${item.nome}</span>`;
        conteudo.appendChild(div);
      } else {
        // Pasta
        const folderEl = document.createElement("div");
        const toggle   = document.createElement("button");
        toggle.className = "pv-folder-toggle";

        const tStyle = [];
        if (item.textColor) tStyle.push(`color:${item.textColor}`);
        if (item.fontSize)  tStyle.push(`font-size:${item.fontSize}px`);
        if (tStyle.length) toggle.style.cssText = tStyle.join(";");

        toggle.innerHTML = `
          <span>${pvIconHTML(item.rawIcon, item.iconColor, 14)}${item.nome}</span>
          <span class="pv-arrow">+</span>`;

        const linksWrap = document.createElement("div");
        linksWrap.className = "pv-folder-links";
        linksWrap.style.display = "none";

        item.links.forEach(l => {
          const sub = document.createElement("div");
          sub.className = "pv-sub-link";
          const lStyle = [];
          if (l.textColor) lStyle.push(`color:${l.textColor}`);
          if (l.fontSize)  lStyle.push(`font-size:${l.fontSize}px`);
          if (lStyle.length) sub.style.cssText = lStyle.join(";");
          sub.innerHTML = pvIconHTML(l.icon, l.iconColor, 12) + `<span>${l.nome}</span>`;
          linksWrap.appendChild(sub);
        });

        toggle.addEventListener("click", () => {
          const open = linksWrap.style.display === "block";
          linksWrap.style.display = open ? "none" : "block";
          toggle.querySelector(".pv-arrow").textContent = open ? "+" : "−";
        });

        folderEl.appendChild(toggle);
        folderEl.appendChild(linksWrap);
        conteudo.appendChild(folderEl);
      }
    });
  });
}

/** Renderiza ícone no preview aplicando cor se for FA */
function pvIconHTML(icon, iconColor, size) {
  if (!icon) return "";
  if (isFaIcon(icon)) {
    const style = [`font-size:${size}px`, "flex-shrink:0", iconColor ? `color:${iconColor}` : ""].filter(Boolean).join(";");
    return `<i class="${icon}" style="${style}"></i>`;
  }
  const src = localImageCache[icon] || `resources/icons/${icon}`;
  return `<img src="${src}" style="width:${size}px;height:${size}px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'" alt="">`;
}

const debouncedUpdatePreview = debounce(atualizarPreview, 200);

/* ============================================================
   LOCAL STORAGE
   ============================================================ */
function saveToLocal() {
  const statusEl = document.getElementById("save-indicator");
  if (statusEl) {
    statusEl.classList.add("saving");
    statusEl.innerHTML = '<i class="fas fa-spinner"></i> Salvando...';
  }
  
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getEditorData()));
    mostrarSalvo();
  } catch(e) { 
    console.warn("Erro ao salvar:", e);
    if (statusEl) {
      statusEl.classList.remove("saving");
      statusEl.classList.add("error");
      statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro ao salvar';
      setTimeout(() => {
        statusEl.classList.remove("error");
        statusEl.innerHTML = '<i class="fas fa-cloud"></i> Salvo';
      }, 2000);
    }
  }
}
const debouncedSave = debounce(saveToLocal, 600);

function loadFromLocal() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return false;
    preencherEditor(JSON.parse(saved));
    return true;
  } catch(e) { return false; }
}

function mostrarSalvo() {
  const el = document.getElementById("save-indicator");
  if (!el) return;
  clearTimeout(el._hideTimer);
  el.classList.remove("saving");
  el.innerHTML = '<i class="fas fa-check-circle"></i> Salvo';
  el._hideTimer = setTimeout(() => {
    el.innerHTML = '<i class="fas fa-cloud"></i> Salvo';
  }, 1500);
}

/* ============================================================
   GERAR / COPIAR JSON
   ============================================================ */
document.getElementById("btn-gerar").addEventListener("click", gerarJSON);
function gerarJSON() {
  document.getElementById("json-out").value = JSON.stringify(getEditorData(), null, 2);
}

document.getElementById("btn-copiar").addEventListener("click", () => {
  gerarJSON();
  navigator.clipboard.writeText(document.getElementById("json-out").value).then(() => {
    const msg = document.getElementById("copy-ok");
    msg.classList.add("show");
    setTimeout(() => msg.classList.remove("show"), 2200);
  }).catch(() => {
    alert("Falha ao copiar. Tente novamente.");
  });
});

/* ============================================================
   DOWNLOAD JSON / PACOTE
   ============================================================ */
function downloadJSON() {
  gerarJSON();
  const json = document.getElementById("json-out").value;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function BaixarPacote() {
  // Link para o pacote completo do GitHub
  const url = "https://github.com/user-attachments/files/26864499/Release.webonce.zip";
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.download = "hyperlink-package.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

document.getElementById("btn-download")?.addEventListener("click", BaixarPacote);
document.getElementById("btn-download-json")?.addEventListener("click", downloadJSON);

/* ============================================================
   LIMPAR EDITOR
   ============================================================ */
function limparEditor() {
  document.querySelectorAll("#redes-list .card, #pastas-list .folder-card, #direct-links-list .card").forEach(el=>el.remove());
  const jsonOut = document.getElementById("json-out"); if (jsonOut) jsonOut.value = "";
  ["p-foto","p-nome","p-desc","p-bg"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
  ["foto-preview","bg-preview"].forEach(id => { const el=document.getElementById(id); if(el) el.style.display="none"; });
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  atualizarPreview();
  setStatus("Editor limpo.","load-ok");
}

/* ============================================================
   CARREGAR JSON DO USUÁRIO
   ============================================================ */
function carregarDoUsuario(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      const migratedData = migrateDataFormat(data); // Migração automática
      limparEditor(); preencherEditor(migratedData);
      saveToLocal(); atualizarPreview(); setStatus("✓ JSON carregado com sucesso (migrado se necessário)","load-ok");
    } catch(err) { setStatus("⚠ Arquivo inválido","load-err"); }
  };
  reader.readAsText(file);
}
document.getElementById("jsonFileInput").addEventListener("change", ev => { if(ev.target.files[0]) carregarDoUsuario(ev.target.files[0]); });

/* ============================================================
   MIGRAÇÃO RETROCOMPATÍVEL — Converte formato antigo para novo
   Formato antigo: { pastas[], links[] }
   Formato novo:   { items[] com type:"folder"|"link" }
   ============================================================ */
function migrateDataFormat(data) {
  // Se já tem items[], está no formato novo
  if (data.items && Array.isArray(data.items)) {
    return data; // Já está no formato correto
  }

  // Se tem pastas[] ou links[], está no formato antigo - migrar
  if (data.pastas || data.links) {
    console.log("🔄 Migrando dados do formato antigo para o novo...");

    const migratedData = { ...data };
    migratedData.items = [];

    // Migrar pastas antigas
    if (data.pastas && Array.isArray(data.pastas)) {
      data.pastas.forEach(pasta => {
        const migratedPasta = {
          id: pasta.id || generateId(),
          type: "folder",
          nome: pasta.nome || "",
          topic: pasta.topic || "",
          icon: pasta.icon || pasta.Icon || "", // Suporte para Icon antigo
          iconColor: pasta.iconColor || "",
          textColor: pasta.textColor || "",
          fontSize: pasta.fontSize || "",
          links: pasta.links || []
        };
        migratedData.items.push(migratedPasta);
      });
    }

    // Migrar links diretos antigos
    if (data.links && Array.isArray(data.links)) {
      data.links.forEach(link => {
        const migratedLink = {
          id: link.id || generateId(),
          type: "link",
          nome: link.nome || "",
          topic: link.topic || "",
          url: link.url || "",
          icon: link.icon || "",
          iconColor: link.iconColor || "",
          textColor: link.textColor || "",
          fontSize: link.fontSize || ""
        };
        migratedData.items.push(migratedLink);
      });
    }

    // Remover campos antigos
    delete migratedData.pastas;
    delete migratedData.links;

    console.log("✅ Migração concluída! Dados convertidos para o novo formato.");
    return migratedData;
  }

  // Se não tem nenhum dos formatos, retornar como está
  return data;
}

/* ============================================================
   PREENCHER EDITOR
   ============================================================ */
function preencherEditor(data) {
  // Aplicar migração automática se necessário
  data = migrateDataFormat(data);

  const set = (id, val) => { const el=document.getElementById(id); if(el) el.value=val||""; };
  set("p-foto", data.profile); set("p-nome", data.name); set("p-desc", data.description);
  set("p-bg",   data.background); set("p-theme", data.theme);

  if (data.profile) { const img=document.getElementById("foto-preview"); if(img){img.src=data.profile;img.style.display="block";} }
  if (data.background) { const img=document.getElementById("bg-preview"); if(img){img.src=data.background;img.style.display="block";} }

  (data.redes  ||[]).forEach(r => addRede(r));

  // Suporta novo modelo (items) e modelo antigo (pastas + links) - agora com migração automática
  if (data.items) {
    data.items.forEach(item => {
      if (item.type === "folder") addPasta(item);
      else if (item.type === "link") addDirectLink(item);
    });
  } else {
    // Fallback para modelo antigo (não deveria acontecer após migração)
    (data.pastas ||[]).forEach(p => addPasta(p));
    (data.links  ||[]).forEach(l => addDirectLink(l));
  }
}

/* ============================================================
   STATUS BAR
   ============================================================ */
function setStatus(msg, cls) {
  const el = document.getElementById("load-status"); if(!el) return;
  el.textContent = msg; el.className = "load-msg " + cls;
}

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
window.addEventListener("load", () => {
  const hadLocal = loadFromLocal();
  if (hadLocal) {
    setStatus("✓ Rascunho restaurado do navegador","load-ok"); atualizarPreview();
  } else {
    fetch(DATA_JSON_PATH)
      .then(res => { if(!res.ok) throw new Error(); return res.json(); })
      .then(data => { preencherEditor(data); saveToLocal(); setStatus("✓ data.json carregado","load-ok"); atualizarPreview(); })
      .catch(() => { setStatus("⚠ Nenhum rascunho ou data.json encontrado","load-err"); atualizarPreview(); });
  }
});

/* ============================================================
   RESETAR PARA data.json
   ============================================================ */
document.getElementById("btn-reset-json")?.addEventListener("click", () => {
  if (!confirm("Descartar rascunho e recarregar o data.json original?")) return;
  localStorage.removeItem(LOCAL_STORAGE_KEY); limparEditor();
  fetch(DATA_JSON_PATH)
    .then(res => { if(!res.ok) throw new Error(); return res.json(); })
    .then(data => { preencherEditor(data); saveToLocal(); atualizarPreview(); setStatus("✓ data.json recarregado","load-ok"); })
    .catch(() => setStatus("⚠ data.json não encontrado: " + DATA_JSON_PATH,"load-err"));
});