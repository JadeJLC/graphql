/**
 * Calcule l'xp nécessaire pour passer au prochain niveau (le code volé dans le js de l'intra)
 * @returns {array} Les différents niveaux d'xp correspondant à chaque niveau
 */
function buildLevelTable() {
  const Ue = 128;
  const jn = Array(Ue + 1);
  let Cr = -1,
    Xl = 0,
    Kl = 0;

  for (; ++Cr < Ue + 1; ) {
    const e = Cr * 0.66 + 1;
    const t = (Cr + 2) * 150 + 50;
    const r = Math.round(e * t);
    Kl += r;
    Xl += e;
    jn[Cr] = {
      level: Cr,
      base: t,
      cumul: Kl,
      total: r,
      xpIndex: Math.floor(Xl),
    };
  }

  return jn;
}

/**
 * Affiche le rang correct de l'utilisateur en fonction de son niveau
 * @param {int} level Le niveau actuel de la personne connectée
 * @returns {string} Le rang associé au niveau
 */
function getRankName(level) {
  if (level >= 60) return "Full-Stack Developer";
  if (level >= 55) return "Confirmed Developer";
  if (level >= 50) return "Junior Developer";
  if (level >= 40) return "Basic Developer";
  if (level >= 30) return "Assistant Developer";
  if (level >= 20) return "Apprentice Developer";
  if (level >= 10) return "Beginner Developer";
  return "Aspiring Developer";
}

/**
 * Formate les dates récupérées dans la base de données pour être plus lisibles
 * @param {string} dateString La date au format brut
 * @returns {string} La date reformatée
 */
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const dayMonth = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });

  const year = date.getFullYear();

  if (date.toDateString() === now.toDateString()) {
    return `Aujourd'hui`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Hier`;
  }

  if (year === now.getFullYear()) {
    return `${dayMonth}`;
  } else {
    return `${dayMonth}/${year}`;
  }
}

/**
 * Classifie les compétences entre "Technique" et "Langages" comme sur l'intra
 * @param {string} skillName Le nom de la compétence
 * @returns true si c'est un langage de programmation, false si c'est une technique
 */
function classifySkills(skillName) {
  const languages = [
    "go",
    "git",
    "js",
    "html",
    "c",
    "sql",
    "css",
    "unix",
    "docker",
    "rust",
    "java",
    "nrd",
    "shell",
    "php",
    "python",
    "ruby",
    "c++",
    "graphql",
    "ror",
    "laravel",
    "django",
    "electron",
  ];

  if (languages.includes(skillName)) return true;

  return false;
}

export { buildLevelTable, getRankName, formatTime };
