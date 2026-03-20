import { animatePieChart } from "./animation.js";

/**
 * Calcule l'xp nécessaire pour passer au prochain niveau (#le code volé dans le js de l'intra)
 * @returns {array} Les différents niveaux d'xp correspondant à chaque niveau
 */
function buildLevelTable() {
  const maxLvl = 128;
  const data = Array(maxLvl + 1);
  let level = -1,
    allMult = 0,
    cumul = 0;

  for (; ++level < maxLvl + 1; ) {
    const multiplier = level * 0.66 + 1;
    const base = (level + 2) * 150 + 50;
    const total = Math.round(multiplier * base);
    cumul += total;
    allMult += multiplier;
    data[level] = {
      level: level,
      base: base,
      cumul: cumul,
      total: total,
      xpIndex: Math.floor(allMult),
    };
  }

  return data;
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

  return `${dayMonth}/${year}`;
}

/**
 * Récupère le nombre de points par compétences
 * @param {object} skillList Les compétences récupérées dans l'API
 */
function getSkillTotal(skillList) {
  const seen = new Set();

  const skillLevel = skillList
    .filter((skill) => {
      if (seen.has(skill.object.name)) return false;
      seen.add(skill.object.name);
      return true;
    })
    .reduce((acc, skill) => {
      skill.type = skill.type.replace("skill_", "");
      if (!acc[skill.type] || skill.amount > acc[skill.type]) {
        acc[skill.type] = skill.amount;
      }
      return acc;
    }, {});

  return skillLevel;
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

/**
 * Fabrique une icône pour une compétence (cadre, infobulle, nom raccourci)
 * @param {string} skillName Le nom de la compétence
 * @returns
 */
function createSkillLogo(skillName) {
  let skillShort = skillName;
  if (skillName.includes("-")) {
    const dividedSkill = skillName.split("-");
    const initials = dividedSkill[0][0] + dividedSkill[1][0];
    skillShort = initials;
  } else if (skillName.length >= 4) {
    skillShort = skillName[0] + skillName[1] + skillName[2];
  }

  const skillFullName = getSkillFullName(skillName);

  const skillLogo = `<div class="skill-logo" alt="${skillName}" title="${skillName}">${skillShort} <span>${skillFullName}</span></div>`;
  return skillLogo;
}

/**
 * Fournit le nom complet (en français) des compétences pour remplacer le raccourci de l'APi
 * @param {string} skillName Le nom de la compétence
 * @returns
 */
function getSkillFullName(skillName) {
  const fullSkills = {
    prog: "Bases de programmation",
    algo: "Algorithmique",
    stats: "Statistiques",
    ai: "IA",
    js: "Javascript",
  };

  if (fullSkills[skillName]) {
    return fullSkills[skillName];
  }
  return skillName;
}

/**
 * Crée les balises HTML pour toutes les compétences d'une catégorie
 * @param {object} skillList La liste des compétences et de leur valeur skill{name, value, logo}
 * @returns
 */
function createHTMLSkill(skillList) {
  let HTMLskill = "";
  skillList.forEach((skill) => {
    HTMLskill += `<div class="skill-bloc">${skill.logo} <div class="skill-value">${skill.value}%</div></div>`;
  });

  return HTMLskill;
}

/**
 * Fabrique le graphique en SVG à partir des données du ratio
 * @param {object} ratio Ratio d'audit via l'xp donnée et reçue ratio{given, received, total}
 * @returns
 */
function createSVGPieChart(ratio) {
  const ratioChart = document.getElementById("ratio-chart");
  ratioChart.innerHTML = "";

  const slices = [
    {
      id: "given-xp",
      className: "audit-given",
      value: ratio.given,
      color: "var(--violet)",
    },
    {
      id: "received-xp",
      className: "audit-received",
      value: ratio.received,
      color: "var(--pale-sky)",
    },
  ];

  let currentStartPercent = 0;
  const radius = 45;
  const cx = 50;
  const cy = 50;

  slices.forEach((slice) => {
    const percent = (slice.value / ratio.total) * 100;
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );

    element.setAttribute("fill", slice.color);
    element.classList.add(slice.className);
    element.setAttribute("stroke", "var(--border-shine)");
    element.setAttribute("stroke-width", "0.8");

    const label = document.getElementById(slice.id);
    element.addEventListener("mouseenter", () => {
      label.classList.add("active");
      ratioChart.appendChild(element);
    });
    element.addEventListener("mouseleave", () =>
      label.classList.remove("active"),
    );

    animatePieChart(element, percent, currentStartPercent, radius, cx, cy);

    ratioChart.appendChild(element);
    currentStartPercent += percent;
  });
}

/**
 * Crée une liste de trimestres dynamique entre le premier gain d'xp et la date du jour
 * @param {GraphQL data} transactions La liste des gains d'xp
 * @returns {array} Une liste de trimestres pour séparer le graphique en périodes
 */
function buildQuarters(transactions) {
  const now = new Date();
  const firstDate = new Date(transactions[0].date);

  const MONTHS_FR = [
    "Jan",
    "Fév",
    "Mars",
    "Avr",
    "Mai",
    "Jun",
    "Juil",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];

  const startMonth = Math.floor(firstDate.getMonth() / 3) * 3;
  let cursor = new Date(firstDate.getFullYear(), startMonth, 1);

  const quarters = [];
  while (cursor < now) {
    const nextCursor = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);

    const start = quarters.length === 0 ? firstDate : new Date(cursor);
    const end = nextCursor > now ? now : nextCursor;

    const endLabelMonth =
      end >= nextCursor ? nextCursor.getMonth() - 1 : end.getMonth();
    const label = `${MONTHS_FR[start.getMonth()]}–${MONTHS_FR[endLabelMonth]} ${start.getFullYear()}`;

    quarters.push({ label, start, end });
    cursor = nextCursor;
  }

  return quarters;
}

/**
 * Fonction pour créer le graphique SVG de l'évolution de l'xp au fil du temps
 * @param {GraphQL data} transactions La liste des gains d'xp
 * @returns
 */
function createSVGLineChart(transactions) {
  const [ML, MT, W, H] = [70, 20, 710, 330];

  const quarters = buildQuarters(transactions);
  const timeStart = quarters[0].start.getTime();
  const timeEnd = quarters.at(-1).end.getTime();
  const MAX = Math.ceil(transactions.at(-1).xp / 10_000) * 10_000;

  const sx = (date) =>
    ML + ((new Date(date).getTime() - timeStart) / (timeEnd - timeStart)) * W;
  const sy = (xp) => MT + H - (xp / MAX) * H;

  const points = transactions.map(({ date, xp, projectxp, project }) => ({
    x: sx(date),
    y: sy(xp),
    xp,
    projectxp,
    name: project,
  }));

  const ptStr = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const areaStr = `M${points[0].x},${MT + H} ${ptStr} L${points.at(-1).x},${MT + H}Z`;

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const y = MT + i * (H / 4),
      val = MAX - i * (MAX / 4);
    return `
      <line x1="${ML}" y1="${y}" x2="${ML + W}" y2="${y}" stroke="white" stroke-width=".5" opacity=".15"/>
      <text x="${ML - 10}" y="${y + 5}" text-anchor="end">${val >= 1000 ? val / 1000 + "k" : val}</text>`;
  }).join("");

  const xLabels = quarters
    .map(({ label, start, end }) => {
      const xMid = sx(new Date((start.getTime() + end.getTime()) / 2));
      const xLine = sx(start);
      return `
      <line x1="${xLine}" y1="${MT}" x2="${xLine}" y2="${MT + H}" stroke="white" stroke-width=".5" opacity=".2" stroke-dasharray="4,4"/>
      <text x="${xMid}" y="${MT + H + 25}" text-anchor="middle" font-size="11">${label}</text>`;
    })
    .join("");

  const dots = points
    .map(
      ({ x, y }) => `
    <circle cx="${x}" cy="${y}" r="6"  fill="var(--violet)" opacity="0" pointer-events="none" class="xp-dot-vis"/>
    <circle cx="${x}" cy="${y}" r="12" fill="transparent"  class="xp-dot"/>
  `,
    )
    .join("");

  return {
    points,
    svg: `
      <defs>
        <linearGradient id="xp-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="var(--violet)"   stop-opacity=".6"/>
          <stop offset="100%" stop-color="var(--pale-sky)"  stop-opacity=".05"/>
        </linearGradient>
      </defs>

      <g stroke="white" stroke-width="1.5" opacity=".8">
        <line x1="${ML}" y1="${MT}"     x2="${ML}"        y2="${MT + H}"/>
        <line x1="${ML}" y1="${MT + H}" x2="${ML + W}"    y2="${MT + H}"/>
      </g>

      <g fill="var(--pale-sky)" font-family="var(--font-tech-ui)" font-size="13">
        ${yLabels}
        ${xLabels}
      </g>

      <path d="${areaStr}" fill="url(#xp-fill)"/>
      <polyline points="${ptStr}" fill="none" stroke="var(--violet)" stroke-width="2.5"
                stroke-linejoin="round" style="filter:drop-shadow(0 0 5px var(--violet))"/>
      ${dots}

      
    `,
  };
}

export {
  buildLevelTable,
  getRankName,
  formatTime,
  getSkillTotal,
  classifySkills,
  createSkillLogo,
  createHTMLSkill,
  createSVGPieChart,
  createSVGLineChart,
};
