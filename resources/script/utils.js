/**
 * Renderiza ícone (classe FontAwesome ou caminho de imagem)
 * @param {string} icon - Classe FA (ex: "fab fa-discord") ou caminho de arquivo
 * @param {number} size - Tamanho em pixels
 * @returns {string} HTML do ícone
 */
function createIconHTML(icon, size = 14) {
  if (!icon || !icon.trim()) return "";
  icon = icon.trim();
  if (icon.startsWith("fa")) {
    return `<i class="${icon}" style="font-size:${size}px;flex-shrink:0"></i>`;
  }
  return `<img src="${icon}" style="width:${size}px;height:${size}px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'" alt="">`;
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
