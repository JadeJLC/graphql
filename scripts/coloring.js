/**
 * Transforme les données hexadécimales extraites des variables de couleur en données hsl pour les fonctions javascript
 * (hsl = hue, saturation, light)
 * @param {string} hex Couleur au format hexadécimal
 * @returns Couleur au format hsl
 */
function hexToHsl(hex) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Vérifie si deux éléments sont adjacents dans la grille du treemap pour éviter d'attribuer la même couleur à deux blocs voisins.
 * h = axe horizontal / v = axe vertical
 * * @param {Object} blocA - Objet contenant les propriétés top, left, right, bottom
 * @param {Object} blocB - Objet contenant les propriétés top, left, right, bottom
 * @param {number} [tolerance=3] - Marge d'erreur en pixels pour la détection (pour prendre en compte les margin)
 * @returns {boolean} - Retourne true si les blocs sont côte à côte ou l'un sur l'autre
 */
function areAdjacent(blocA, blocB, tolerance = 3) {
  const hOverlap =
    blocA.left < blocB.right + tolerance &&
    blocB.left < blocA.right + tolerance;

  const vOverlap =
    blocA.top < blocB.bottom + tolerance &&
    blocB.top < blocA.bottom + tolerance;

  const hTouch =
    Math.abs(blocA.right - blocB.left) <= tolerance ||
    Math.abs(blocB.right - blocA.left) <= tolerance;

  const vTouch =
    Math.abs(blocA.bottom - blocB.top) <= tolerance ||
    Math.abs(blocB.bottom - blocA.top) <= tolerance;

  return (hTouch && vOverlap) || (vTouch && hOverlap);
}

/**
 * Crée une palette de 8 couleurs, variations de celles présentes dans les variables CSS, pour le treemap
 * @returns Une couleur au format hsl
 */
function buildPalette() {
  const root = getComputedStyle(document.documentElement);
  const vars = ["--dusk-blue", "--blue-slate", "--pale-sky", "--pacific-cyan"];

  return vars
    .map((name) => {
      const val = root.getPropertyValue(name).trim();
      return hexToHsl(val || "#38506f");
    })
    .flatMap(({ h, s, l }) => [
      { h, s, l }, // Base
      {
        h,
        s: Math.min(s + 10, 100),
        l: l > 50 ? Math.max(l - 18, 10) : Math.min(l + 18, 90), // Variant
      },
    ]);
}

/**
 * Génère des couleurs pour les graphiques 3 et 4 du tableau de bord, accordées aux variables CSS
 * @param {string} mode "arc" = création des arcs du Radial Bar Chart, pour éviter les arcs sombres sur fond sombre
 * @returns {object} données de couleur contenant une couleur de fond, une bordure et un indicateur de luminosité (pour la couleur d'écriture)
 */
function createColorPalette(mode) {
  const palette = buildPalette();

  return function (index, isSub = false, subIndex = 0) {
    const base = palette[index % palette.length];
    let { h, s, l } = { ...base };

    if (isSub) {
      const shift = (subIndex + 1) * 4;
      l = l > 50 ? l - shift : l + shift;
      s = Math.min(s + 5, 100);
    }

    const borderL = l > 50 ? Math.min(l + 8, 100) : Math.max(l - 8, 0);

    if (mode == "arc") {
      l = l < 35 ? (l += 10) : l;
    }

    return {
      bg: `hsl(${h}, ${s}%, ${l}%)`,
      border: `hsl(${h}, ${s}%, ${borderL}%)`,
      isLight: l > 55,
    };
  };
}

export { buildPalette, createColorPalette, areAdjacent };
