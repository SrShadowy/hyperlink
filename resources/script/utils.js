/**
 * Renderiza ícone (classe FontAwesome ou caminho de imagem)
 * Se o nome do arquivo estiver no localImageCache (upload local), usa o base64.
 * @param {string} icon - Classe FA (ex: "fab fa-discord") ou nome/caminho de arquivo
 * @param {number} size - Tamanho em pixels
 * @returns {string} HTML do ícone
 */
function createIconHTML(icon, size = 14) {
  if (!icon || !icon.trim()) return "";
  icon = icon.trim();
  if (icon.startsWith("fa")) {
    return `<i class="${icon}" style="font-size:${size}px;flex-shrink:0"></i>`;
  }
  // Usa base64 do cache se o arquivo foi carregado localmente
  const src = (typeof localImageCache !== "undefined" && localImageCache[icon])
    ? localImageCache[icon]
    : icon;
  return `<img src="${src}" style="width:${size}px;height:${size}px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'" alt="">`;
}

/**
 * Debounce — aguarda X ms sem nova execução antes de chamar a função
 * @param {Function} func - Função a debounce
 * @param {number} wait - Milissegundos de espera
 * @returns {Function} Função com debounce aplicado
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Escapar HTML para prevenir XSS
 * @param {string} str - String a escapar
 * @returns {string} String escapada
 */
function escapeHTML(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Gera um ID único simples
 * @returns {string} ID único
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Converte hex (#1d9bf0) para string rgb (rgb(29, 155, 240))
 * @param {string} hex
 * @returns {string}
 */
function hexToRgb(hex) {
  if (!hex || !hex.startsWith("#")) return "";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "";
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Tenta converter uma string de cor (rgb, rgba, hex, nome) para hex #rrggbb
 * Usado para preencher o <input type="color"> ao carregar um JSON existente.
 * @param {string} color - Ex: "rgb(29, 155, 240)" ou "#1d9bf0"
 * @returns {string} hex ou "" se não conseguir converter
 */
function colorToHex(color) {
  if (!color) return "";
  color = color.trim();
  if (color.startsWith("#")) return color.length === 7 ? color : "";

  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const toHex = n => parseInt(n).toString(16).padStart(2, "0");
    return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
  }

  // Fallback via canvas para nomes CSS ("red", "blue", etc.)
  try {
    const canvas  = document.createElement("canvas");
    canvas.width  = 1; canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const toHex = n => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch (_) {
    return "";
  }
}