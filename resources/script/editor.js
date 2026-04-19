const DATA_JSON_PATH = "./resources/data.json";

/* ============================================================
   ÍCONES DISPONÍVEIS DO FONT AWESOME
   ============================================================ */
const FA_ICONS = [
  { l: "Instagram",   v: "fab fa-instagram", i: "fab fa-instagram"  },
  { l: "Twitter/X",   v: "fab fa-twitter",   i: "fab fa-twitter"    },
  { l: "Twitch",      v: "fab fa-twitch",    i: "fab fa-twitch"     },
  { l: "YouTube",     v: "fab fa-youtube",   i: "fab fa-youtube"    },
  { l: "Discord",     v: "fab fa-discord",   i: "fab fa-discord"    },
  { l: "TikTok",      v: "fab fa-tiktok",    i: "fab fa-tiktok"     },
  { l: "GitHub",      v: "fab fa-github",    i: "fab fa-github"     },
  { l: "LinkedIn",    v: "fab fa-linkedin",  i: "fab fa-linkedin"   },
  { l: "Spotify",     v: "fab fa-spotify",   i: "fab fa-spotify"    },
  { l: "Reddit",      v: "fab fa-reddit",    i: "fab fa-reddit"     },
  { l: "Facebook",    v: "fab fa-facebook",  i: "fab fa-facebook"   },
  { l: "Link",        v: "fas fa-link",      i: "fas fa-link"       },
  { l: "Livro/Guia",  v: "fas fa-book",      i: "fas fa-book"       },
  { l: "Vídeo",       v: "fas fa-video",     i: "fas fa-video"      },
  { l: "Gamepad",     v: "fas fa-gamepad",   i: "fas fa-gamepad"    },
  { l: "Star",        v: "fas fa-star",      i: "fas fa-star"       },
];

const debouncedUpdatePreview = debounce(atualizarPreview, 200);

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("sec-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "json") gerarJSON();
  });
});


//#regions Preview
let previewTheme = "dark";
document.getElementById("preview-theme-btn").addEventListener("click", () => {
  const root = document.getElementById("preview-root");
  previewTheme = previewTheme === "dark" ? "light" : "dark";
  root.classList.toggle("dark-theme",  previewTheme === "dark");
  root.classList.toggle("light-theme", previewTheme === "light");
  document.getElementById("preview-theme-btn").innerHTML =
    previewTheme === "dark" ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});



function atualizarPreview() {

  const foto = document.getElementById("p-foto").value.trim();
  const pvFoto = document.getElementById("pv-foto");
  if (foto) { pvFoto.src = foto; pvFoto.style.display = "block"; }
  else       { pvFoto.style.display = "none"; }

  document.getElementById("pv-nome").textContent = document.getElementById("p-nome").value.trim();
  document.getElementById("pv-desc").textContent = document.getElementById("p-desc").value.trim();

  
  const redesEl = document.getElementById("pv-redes");
  redesEl.innerHTML = "";
  document.querySelectorAll("[id^='rn-']").forEach(el => {
    const id  = el.id.replace("rn-", "");
    const url = document.getElementById("ru-" + id)?.value.trim() || "#";
    const ic  = document.getElementById("ri-" + id)?.value.trim() || "";
    if (!ic) return;
    const a = document.createElement("a");
    a.href = url; a.target = "_blank";
    a.innerHTML = `<i class="${ic}"></i>`;
    redesEl.appendChild(a);
  });


  const conteudo = document.getElementById("pv-conteudo");
  conteudo.innerHTML = "";


  const topicsOrder = [];
  const topicPastas = {};
  const topicLinks  = {};

  document.querySelectorAll("[id^='pasta-']").forEach(el => {
    const id    = el.id.replace("pasta-", "");
    const topic = document.getElementById("pt-" + id)?.value.trim() || "";
    const nome  = document.getElementById("pn-" + id)?.value.trim() || "";
    const icon  = document.getElementById("pi-" + id)?.value.trim() || "";
    if (!nome) return;

    const links = [];
    el.querySelectorAll(`[id^='sl-${id}-'][id$='-n']`).forEach(lel => {
      const lid  = lel.id.replace("-n", "");
      const ln   = document.getElementById(lid + "-n")?.value.trim() || "";
      const lu   = document.getElementById(lid + "-u")?.value.trim() || "#";
      const li   = document.getElementById(lid + "-i")?.value.trim() || "";
      if (ln) links.push({ nome: ln, url: lu, icon: li });
    });

    if (!topicPastas[topic]) { topicPastas[topic] = []; if (!topicsOrder.includes(topic)) topicsOrder.push(topic); }
    topicPastas[topic].push({ nome, icon, links });
  });

  document.querySelectorAll("[id^='dl-']").forEach(el => {
    const id    = el.id.replace("dl-", "");
    const topic = document.getElementById("dlt-" + id)?.value.trim() || "";
    const nome  = document.getElementById("dln-" + id)?.value.trim() || "";
    const url   = document.getElementById("dlu-" + id)?.value.trim() || "#";
    const ic    = document.getElementById("dli-" + id)?.value.trim() || "";
    if (!nome) return;
    if (!topicLinks[topic]) { topicLinks[topic] = []; if (!topicsOrder.includes(topic)) topicsOrder.push(topic); }
    topicLinks[topic].push({ nome, url, icon: ic });
  });

  topicsOrder.forEach(topic => {

    const tt = document.createElement("p");
    tt.className = "pv-topic-title";
    tt.textContent = topic;
    conteudo.appendChild(tt);

    (topicLinks[topic] || []).forEach(l => {
      const a = document.createElement("div");
      a.className = "pv-link";
      a.innerHTML = iconHTML(l.icon, 14) + `<span>${l.nome}</span>`;
      conteudo.appendChild(a);
    });

    // pastas
    (topicPastas[topic] || []).forEach(p => {
      const folderEl = document.createElement("div");

      const toggle = document.createElement("button");
      toggle.className = "pv-folder-toggle";

      const iconSrc = p.icon ? `resources/icons/${p.icon}` : "";
      toggle.innerHTML = `
        <span>${iconSrc ? `<img src="${iconSrc}" onerror="this.style.display='none'">` : ""}${p.nome}</span>
        <span class="pv-arrow">+</span>`;

      const linksWrap = document.createElement("div");
      linksWrap.className = "pv-folder-links";
      linksWrap.style.display = "none";

      p.links.forEach(l => {
        const sub = document.createElement("div");
        sub.className = "pv-sub-link";
        sub.innerHTML = iconHTML(l.icon, 12) + `<span>${l.nome}</span>`;
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
    });
  });
}


function iconHTML(icon, size = 14) {
  return createIconHTML(icon, size);
}

document.body.addEventListener("input", debouncedUpdatePreview);
document.body.addEventListener("change", debouncedUpdatePreview);


document.getElementById("p-foto").addEventListener("input", function () {
  const img = document.getElementById("foto-preview");
  if (this.value) { img.src = this.value; img.style.display = "block"; }
  else              { img.style.display = "none"; }
});

//#endregion

/* ============================================================
   HELPER — Icon Picker HTML
   Corrigido: botões FA colocam apenas o valor "fab fa-..." no input,
   nunca o caminho da pasta.
   ============================================================ */
function iconPickerHTML(fieldId, currentValue = "") {
  const esc = v => v.replace(/"/g, "&quot;");
  return `
    <div class="icon-picker-wrap">
      <input id="${fieldId}" type="text" value="${esc(currentValue)}" placeholder="fab fa-discord  ou  ./resources/icons/arma.png">
      <p class="icon-section-label">Font Awesome — clique para selecionar:</p>
      <div class="icon-grid">
        ${FA_ICONS.map(i =>
          `<span class="icon-opt${currentValue === i.v ? " sel" : ""}"
               data-target="${fieldId}" data-value="${i.v}">
             <i class="${i.i}"></i>${i.l}
           </span>`
        ).join("")}
      </div>
    </div>`;
}

/* ============================================================
   EVENT DELEGATION — Remove, adiciona, etc
   ============================================================ */
document.body.addEventListener("click", e => {
  const action = e.target.closest("[data-action]")?.dataset.action;

  if (action === "remove-rede" || action === "remove-pasta" || action === "remove-sublink" || action === "remove-directlink") {
    e.target.closest(".card, .folder-card, .link-row").remove();
    debouncedUpdatePreview();
    return;
  }

  if (action === "add-sublink") {
    const pastaId = e.target.closest("[data-action]").dataset.pastaId;
    addSubLink(pastaId);
    debouncedUpdatePreview();
    return;
  }

  if (e.target.closest(".icon-grid [data-target]")) {
    const opt = e.target.closest("[data-target]");
    const input = document.getElementById(opt.dataset.target);
    if (input) {
      input.value = opt.dataset.value;
      opt.closest(".icon-grid").querySelectorAll(".icon-opt").forEach(o => o.classList.remove("sel"));
      opt.classList.add("sel");
      debouncedUpdatePreview();
    }
  }
});

//#regions RedeSociais
document.getElementById("btn-add-rede").addEventListener("click", () => addRede());

function addRede(data = {}) {
  const id  = generateId();
  const div = document.createElement("div");
  div.className = "card";
  div.id = `rede-${id}`;
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
      ${iconPickerHTML("ri-" + id, data.icon || "")}
    </div>
    <div class="flex-end">
      <button class="btn btn-danger" data-action="remove-rede">
        <i class="fas fa-trash"></i> Remover
      </button>
    </div>`;
  document.getElementById("redes-list").appendChild(div);
}
//#endregion

// #region PASTAS_LINKS
document.getElementById("btn-add-pasta").addEventListener("click", () => addPasta());

function addPasta(data = {}) {
  const id = generateId();

  const div = document.createElement("div");
  div.className = "folder-card";
  div.id = `pasta-${id}`;
  div.innerHTML = `
    <div class="two-col">
      <div class="field-group">
        <label>Nome da Pasta</label>
        <input id="pn-${id}" type="text" value="${escapeHTML(data.nome)}" placeholder="Nome da pasta">
      </div>
      <div class="field-group">
        <label>Tópico</label>
        <input id="pt-${id}" type="text" value="${escapeHTML(data.topic)}" placeholder="Guia">
      </div>
    </div>
    <div class="field-group">
      <label>Ícone da Pasta (arquivo em resources/icons/)</label>
      <input id="pi-${id}" type="text" value="${escapeHTML(data.Icon)}" placeholder="MHWilds.png">
    </div>
    <p class="sub-title">Links dentro desta pasta</p>
    <div id="slinks-${id}"></div>
    <div class="flex-end">
      <button class="btn btn-add" data-action="add-sublink" data-pasta-id="${id}">
        <i class="fas fa-plus"></i> Adicionar link
      </button>
      <button class="btn btn-danger" data-action="remove-pasta">
        <i class="fas fa-trash"></i> Remover pasta
      </button>
    </div>`;

  document.getElementById("pastas-list").appendChild(div);
  (data.links || []).forEach(l => addSubLink(id, l));
}

function addSubLink(pid, data = {}) {
  const sid = generateId();
  const uid = `sl-${pid}-${sid}`;
  const div = document.createElement("div");
  div.className = "link-row";
  div.id = uid;
  div.innerHTML = `
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
    <div class="field-group">
      <label>Ícone (opcional)</label>
      ${iconPickerHTML(uid + "-i", data.icon || "")}
    </div>
    <div class="flex-end">
      <button class="btn btn-danger" data-action="remove-sublink">
        <i class="fas fa-trash"></i> Remover
      </button>
    </div>`;
  document.getElementById(`slinks-${pid}`).appendChild(div);
}

document.getElementById("btn-add-dl").addEventListener("click", () => addDirectLink());


function addDirectLink(data = {}) {
  const id  = generateId();
  const div = document.createElement("div");
  div.className = "card";
  div.id = `dl-${id}`;
  div.innerHTML = `
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
    <div class="field-group">
      <label>Ícone (opcional)</label>
      ${iconPickerHTML("dli-" + id, data.icon || "")}
    </div>
    <div class="flex-end">
      <button class="btn btn-danger" data-action="remove-directlink">
        <i class="fas fa-trash"></i> Remover
      </button>
    </div>`;
  document.getElementById("direct-links-list").appendChild(div);
}

// #endregion

// #region JSON



function BaixarPacote()
{
  const url = "https://github.com/user-attachments/files/26864499/Release.webonce.zip";
  const a = document.createElement("a");
  a.href = url;

  const filename = url.split("/").pop();
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

}


document.getElementById("btn-download").addEventListener("click", BaixarPacote);

document.getElementById("btn-gerar").addEventListener("click", gerarJSON);

function gerarJSON() {
  const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };

  const profile     = get("p-foto");
  const name        = get("p-nome");
  const description = get("p-desc");
  const background  = get("p-bg");

  const theme = get("p-theme").toLowerCase();   

  const redes = [];
  document.querySelectorAll("[id^='rn-']").forEach(el => {
    const id  = el.id.replace("rn-", "");
    const obj = { nome: get("rn-"+id), url: get("ru-"+id), icon: get("ri-"+id) };
    if (obj.nome || obj.url) redes.push(obj);
  });

  const pastas = [];
  document.querySelectorAll("[id^='pasta-']").forEach(el => {
    const id    = el.id.replace("pasta-", "");
    const links = [];
    el.querySelectorAll(`[id^='sl-${id}-'][id$='-n']`).forEach(lel => {
      const lid  = lel.id.replace("-n","");
      const link = { nome: get(lid+"-n"), url: get(lid+"-u") };
      const ic   = get(lid+"-i"); if (ic) link.icon = ic;
      if (link.nome || link.url) links.push(link);
    });
    const pasta = { nome: get("pn-"+id), topic: get("pt-"+id), Icon: get("pi-"+id), links };
    if (pasta.nome) pastas.push(pasta);
  });

  const links = [];
  document.querySelectorAll("[id^='dl-']").forEach(el => {
    const id   = el.id.replace("dl-","");
    const link = { topic: get("dlt-"+id), nome: get("dln-"+id), url: get("dlu-"+id) };
    const ic   = get("dli-"+id); if (ic) link.icon = ic;
    if (link.nome || link.url) links.push(link);
  });

  document.getElementById("json-out").value =
    JSON.stringify({ profile, name, description, background, theme, redes, pastas, links }, null, 2);
}


document.getElementById("btn-copiar").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("json-out").value).then(() => {
    const msg = document.getElementById("copy-ok");
    msg.style.display = "inline";
    setTimeout(() => msg.style.display = "none", 2200);
  });
});

// #endregion



/* ============================================================
   INICIALIZAÇÃO — fetch do data.json
   ============================================================ */
window.addEventListener("load", () => {
  const status = document.getElementById("load-status");

  fetch(DATA_JSON_PATH)
    .then(res => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(data => {
      preencherEditor(data);
      if (status) { status.textContent = "✓ data.json carregado com sucesso"; status.className = "load-msg load-ok"; }
      atualizarPreview();
    })
    .catch(err => {
      console.warn("Não foi possível carregar data.json:", err);
      if (status) {
        status.textContent = "⚠ data.json não encontrado — editor em branco. Caminho esperado: " + DATA_JSON_PATH;
        status.className = "load-msg load-err";
      }
      atualizarPreview();
    });
});

function preencherEditor(data) {
  const foto = data.profile || "";
  document.getElementById("p-foto").value = foto;
  if (foto) { const img = document.getElementById("foto-preview"); img.src = foto; img.style.display = "block"; }
  document.getElementById("p-nome").value = data.name        || "";
  document.getElementById("p-desc").value = data.description || "";
  (data.redes  || []).forEach(r => addRede(r));
  (data.pastas || []).forEach(p => addPasta(p));
  (data.links  || []).forEach(l => addDirectLink(l));
}

/* ============================================================
  Carregar o json do input e preencher o editor
============================================================ */

function limparEditor() {
  const listItems = document.querySelectorAll("#redes-list .card, #pastas-list .folder-card, #direct-links-list .card");
  listItems.forEach(item => item.remove());
  const editor = document.getElementById("json-out");
  if (editor) editor.value = "";
  window.editorData = {};
}

function carregarDoUsuario(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      preencherEditor(data); 
      if (status) {
        status.textContent = "✓ JSON do usuário carregado com sucesso";
        status.className = "load-msg load-ok";
      }
      atualizarPreview();
    } catch (err) {
      console.error("Erro ao ler JSON:", err);
      if (status) {
        status.textContent = "⚠ Arquivo inválido — não foi possível carregar";
        status.className = "load-msg load-err";
      }
    }
  };
  reader.readAsText(file);
}

document.getElementById("jsonFileInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    limparEditor();
    carregarDoUsuario(file);
  }
});
