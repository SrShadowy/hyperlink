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

// Mapa de cores CSS comuns - MUITO mais rápido que canvas!
const CSS_COLOR_MAP = {
  'red': '#ff0000', 'green': '#008000', 'blue': '#0000ff',
  'white': '#ffffff', 'black': '#000000', 'yellow': '#ffff00',
  'cyan': '#00ffff', 'magenta': '#ff00ff', 'gray': '#808080',
  'orange': '#ffa500', 'purple': '#800080', 'pink': '#ffc0cb',
  'brown': '#a52a2a', 'navy': '#000080', 'teal': '#008080',
  'lime': '#00ff00', 'maroon': '#800000', 'olive': '#808000'
};

/**
 * Converte cor (rgb, rgba, hex, nome CSS) para hex #rrggbb
 * Otimizado: sem canvas lento! Usa mapa de cores CSS.
 * @param {string} color - Ex: "rgb(29, 155, 240)" ou "#1d9bf0" ou "red"
 * @returns {string} hex ou "" se não conseguir converter
 */
function colorToHex(color) {
  if (!color) return "";
  color = color.trim().toLowerCase();
  if (color.startsWith("#")) return color.length === 7 ? color : "";

  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const toHex = n => parseInt(n).toString(16).padStart(2, "0");
    return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
  }
  return CSS_COLOR_MAP[color] || "";
}