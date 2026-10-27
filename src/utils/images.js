
/**
 * Indica si la URL ya es absoluta (http, https, data, blob, etc.).
 * @param {string} url - URL a evaluar.
 * @returns {boolean} - true si no necesita anteponer la base de la API.
 */
const esUrlAbsoluta = (url) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url);

/**
 * Obtiene la URL base de la API sin barras finales.
 * @returns {string} - URL base configurada en REACT_APP_API_URL.
 */
const obtenerBaseApi = () =>
  (process.env.REACT_APP_API_URL || '').trim().replace(/\/+$/, '');

/**
 * Construye la URL final de una imagen. Las rutas relativas (por ejemplo
 * `uploads/foto.png` que devuelve el backend) se resuelven contra
 * REACT_APP_API_URL; las URLs absolutas se devuelven sin modificar.
 *
 * @param {string} url - Ruta o URL de la imagen.
 * @returns {string|null} - URL utilizable o null si no hay valor.
 */
export const resolverUrlImagen = (url) => {
  if (typeof url !== 'string') return null;
  const limpia = url.trim();
  if (!limpia) return null;
  if (esUrlAbsoluta(limpia)) return limpia;

  const ruta = limpia.replace(/^\/+/, '');
  const base = obtenerBaseApi();
  return base ? `${base}/${ruta}` : `/${ruta}`;
};

/**
 * Resuelve la URL de una imagen de producto.
 * @param {string} url - Ruta o URL de la imagen.
 * @returns {Promise<string|null>} - URL utilizable o null si no hay valor.
 */
export const cargarImagen = async (url) => resolverUrlImagen(url);

/**
 * Retorna la URL de la imagen válida entre la principal y la alternativa.
 * @param {string} urlPrincipal - URL de la imagen principal.
 * @param {string} urlAlternativa - URL de la imagen alternativa.
 * @returns {Promise<string|null>} - URL válida o null si ninguna es válida.
 */
export const obtenerImagenValida = async (urlPrincipal, urlAlternativa) =>
  resolverUrlImagen(urlPrincipal) ?? resolverUrlImagen(urlAlternativa);
