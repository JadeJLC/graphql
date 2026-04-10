import { createColorPalette } from "./coloring.js";
import { getAuditors, getGroupMembers } from "./getdata.js";
import { logOut } from "./authentication.js";

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

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp || Date.now() >= payload.exp * 1000) {
      const loading = document.getElementById("loading");
      logOut();
      if (loading) loading.classList.add("is-hidden");
      return true;
    }
  } catch {
    return true;
  }
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
    game: "Jeux vidéo",
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
 * Crée une liste de trimestres dynamique entre le premier gain d'xp et la date du jour
 * @param {GraphQL data} transactions La liste des gains d'xp
 * @returns {array} Une liste de trimestres pour séparer le graphique en périodes
 */
function buildQuarters(transactions) {
  const now = new Date();
  const firstDate = new Date(transactions[0].date);

  const monthList = [
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

    let endLabelMonth =
      end >= nextCursor ? nextCursor.getMonth() - 1 : end.getMonth();

    if (endLabelMonth < 0 || endLabelMonth > 11) endLabelMonth = 11;

    const label = `${monthList[start.getMonth()]}–${monthList[endLabelMonth]} ${start.getFullYear()}`;

    quarters.push({ label, start, end });
    cursor = nextCursor;
  }

  return quarters;
}

/**
 * Construit chaque projet sous la forme d'un objet exploitable pour le graph treemap
 * @param {object} data Les données brutes du projet à trier
 * @returns {object} {name : Nom du projet, category : main, sub ou standalone, xp : nombre d'xp accordés, date : fin du projet}
 */
function buildProjectData(data, mode, currentUser) {
  if (data.object.type != "project") return;

  let project = {
    originalName: data.object.name,
    name: data.object.name,
    category: getProjectCategory(data.object.name) ?? "stand-alone",
    xp: data.amount,
    date: formatTime(data.createdAt),
    coworkers:
      mode == "collab" ? filterCoworkers(data.object.results, currentUser) : "",
  };

  project = formatProjectName(project);

  return project;
}

function formatProjectName(project) {
  if (!project.category)
    project.category = getProjectCategory(project.name) ?? "stand-alone";

  if (project.category.includes("sub-project")) {
    let projectData = project.category.split("(");
    let parent = projectData[1];
    parent = parent.replace(")", "");

    project.name = project.name.replace(parent, "");
  }

  project.name = project.name.replace(/-/g, " ").trim();

  return project;
}

function isSoloProject(data) {
  if (
    (data.attrs.groupMin == 1 && data.attrs.groupMax == 1) ||
    data.type == "exercise" ||
    data.type == "piscine"
  )
    return true;

  return false;
}

function filterCoworkers(resultData, currentUser) {
  const group = resultData[0].group;

  const members = [];

  group.members.forEach((member) => {
    if (member.user.login != currentUser.login) members.push(member.user);
  });

  return members;
}

/**
 * Vérifie si le projet est un sous-projet, un projet principal ou un stand-alone
 * @param {string} projectName Nom du projet
 * @returns {string} main-project pour les projets ayant des sous-projets, sub-project pour les sous-projects, standalone pour les projets simples
 */
function getProjectCategory(projectName) {
  const projectHierarchy = {
    "ascii-art": [
      "ascii-art-color",
      "ascii-art-output",
      "ascii-art-fs",
      "ascii-art-justify",
      "ascii-art-reverse",
    ],
    "ascii-art-web": [
      "ascii-art-web-stylize",
      "ascii-art-web-dockerize",
      "ascii-art-web-export-file",
    ],
    "groupie-tracker": [
      "groupie-tracker-filters",
      "groupie-tracker-geolocalization",
      "groupie-tracker-visualizations",
      "groupie-tracker-search-bar",
    ],
    forum: [
      "forum-authentication",
      "forum-image-upload",
      "forum-security",
      "forum-moderation",
      "forum-advanced-features",
    ],
    "make-your-game": [
      "make-your-game-score-handling",
      "make-your-game-history",
      "make-your-game-different-maps",
    ],
    "real-time-forum": ["real-time-forum-typing-in-progress"],
    "0-shell": ["0-shell-job-control", "0-shell-scripting"],
    standalone: [
      "checkpoint",
      "checkpoint-go",
      "go-reloaded",
      "lem-in",
      "git",
      "tetris-optimizer",
      "atm-management-system",
      "push-swap",
      "my-ls-1",
      "net-cat",
      "linux",
      "login",
      "add-vm",
      "connect",
      "remote",
      "scan",
      "graphql",
      "social-network",
      "mini-framework",
      "bomberman-dom",
      "a-table",
      "get-a-room",
      "lets-do-some-sports",
      "lets-fair-trade",
      "stock-exchange-sim",
      "mister-quiz",
      "shop",
      "netfix",
      "smart-road",
      "filler",
      "rt",
      "localhost",
      "multiplayer-fps",
      "wget",
      "system-monitor",
      "zappy",
      "corewar",
      "make-your-own",
      "math-skills",
      "guess-it-1",
      "linear-stats",
      "guess-it-2",
      "lets-play",
      "angul-it",
      "buy-01",
      "mr-jenk",
      "safe-zone",
      "buy-02",
      "nexus",
      "neo-4-flix",
      "travel-plan",
      "lets-travel",
      "firing-range",
      "widget-factory",
      "army-of-one",
      "zombie-ai",
      "nascar-online-alpha",
      "mouse-vr",
      "the-pages",
      "stealth-boom",
      "jumpo",
      "vehicle-physics",
      "twenty-forty-eight",
      "sky-map",
      "chess",
      "kaquiz",
      "stock-market",
      "secure-messenger",
      "passive",
      "inspector-image",
      "active",
      "local",
      "web-hack",
      "injector",
      "hole-in-bin",
      "mal-track",
      "evasion",
      "obfuscator",
      "malware",
      "nft-marketplace",
      "payment-channel",
      "node-dashboard",
      "financial-instruments",
      "deep-in-net",
      "deep-in-system",
      "crud-master",
      "play-with-containers",
      "orchestrator",
      "cloud-design",
      "code-keeper",
      "kaggle-titanic",
      "nlp-scraper",
      "emotions-detector",
      "sp500-strategies",
      "credit-scoring",
      "computer-science",
      "developer-certifications",
      "networking",
      "cloud-foundations",
      "cloud-fundamentals",
      "cybercloud-basics",
      "green-it-ready",
      "eco-audit",
      "green-stack",
      "sustainable-devops",
      "eco-project",
      "green-fix",
      "green-mission",
    ],
  };

  const keys = Object.keys(projectHierarchy);

  if (keys.includes(projectName)) return "main-project";

  if (projectHierarchy.standalone.includes(projectName)) return "stand-alone";

  for (const [parent, children] of Object.entries(projectHierarchy)) {
    if (parent !== "standalone" && children.includes(projectName)) {
      return `sub-project (${parent})`;
    }
  }

  return "stand-alone";
}

/**
 * Fabrique la tile du treemap pour un projet
 * @param {string} name Nom du projet
 * @param {int} xp Quantité d'xp apportée
 * @param {string} type Standalone, Main ou Subproject
 * @returns
 */
function buildTreemapTile(name, xp, type, ogname) {
  const el = document.createElement("div");
  el.className = `treemap-${type}`;
  el.title = `${ogname ? ogname : name}\n${xp.toLocaleString("fr-FR")} XP`;

  el.innerHTML = `<b>${name}</b>${type == "group" || type == "standalone" ? "" : `<small>${xp.toLocaleString("fr-FR")} XP</small>`}`;

  const details = document.getElementById("prj-details");

  el.addEventListener("mouseenter", () => {
    if (details)
      details.textContent = `${type == "group" ? `${name} (complet)` : `${ogname ? `${ogname} (base)` : name}`} — ${xp.toLocaleString("fr-FR")} xp`;
    details.classList.add("capitalize");
  });

  el.addEventListener("mouseleave", () => {
    if (details) details.textContent = "Survolez un projet pour les détails";
    details.classList.remove("capitalize");
  });
  return el;
}

async function filterProjectByType(user, projectList, jwtoken) {
  let organizedProjects = [];
  let soloProjects = [];
  let groupProjects = [];

  projectList.forEach((project) => {
    if (isSoloProject(project.object)) {
      soloProjects.push(project);
    } else {
      groupProjects.push(project);
    }
  });

  const groupIds = groupProjects.map((p) => p.object.id);
  const memberData = await getGroupMembers(groupIds, jwtoken);

  const membersById = Object.fromEntries(
    memberData.data.object.map((o) => [o.id, o.results]),
  );
  groupProjects.forEach((p) => {
    p.object.results = membersById[p.object.id] ?? [];
  });

  groupProjects.forEach((project) => {
    const classifiedProjet = buildProjectData(project, "collab", user);
    if (classifiedProjet) organizedProjects.push(classifiedProjet);
  });

  soloProjects.forEach((project) => {
    const classifiedProjet = buildProjectData(project);
    if (classifiedProjet) organizedProjects.push(classifiedProjet);
  });

  return organizedProjects;
}

function countProjectsByCoworker(organizedProjects) {
  const allProjects = organizedProjects.filter(
    (p) => Array.isArray(p.coworkers) && p.coworkers.length > 0,
  );

  const map = new Map(); // keyed by login

  allProjects.forEach((project) => {
    project.coworkers.forEach((cw) => {
      if (!cw.login) return;
      if (!map.has(cw.login)) {
        map.set(cw.login, {
          login: cw.login,
          firstName: cw.firstName || "",
          lastName: cw.lastName || "",
          count: 0,
          projects: [],
          subprojects: [],
        });
      }
      const entry = map.get(cw.login);
      entry.count++;

      if (project.category.includes("sub-project")) {
        entry.subprojects.push(project.name);
      } else {
        entry.projects.push(project.name);
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function getProjectGroupMembers(data) {
  let members = [];

  if (!data.group.members) {
    return [];
  }

  data.group.members.forEach((member) => {
    members.push(member.user);
  });

  return members;
}

function buildAuditData(data, index) {
  const captain = {
    login: data.group.captain.login,
    firstName: data.group.captain.firstName,
    lastName: data.group.captain.lastName,
  };

  const audit = {
    end: data.endAt,
    code: data.private.code,
    project: buildProjectData(data.group).name,
    members: getProjectGroupMembers(data),
    captain: captain,
  };

  const getColor = createColorPalette();
  const color = getColor(index);
  const subColors = getColor(index, true, index + 1);

  let memberList = ``;
  audit.members.forEach((member) => {
    if (member.login == audit.captain.login) return;
    memberList += `${member.firstName} ${member.lastName}<br/>`;
  });

  const auditData = `<div class="audit-bloc" title="${audit.project} - ${audit.captain.login}" 
  style="background-color:${color.bg};color:${color.isLight ? "var(--dusk-blue)" : "var(--pale-sky)"}"
  >
  <span class="audit-project" style="background-color:${subColors.bg}">${audit.project}</span><i data-lucide="badge-plus"></i>
  <span class="audit-captain" style="background-color:${subColors.bg}">${audit.captain.login} </span>
  <span class="audit-code" style="border-color:${subColors.bg}"><span>Code<br/> copié !</span>
  <div>${audit.code}</div>
  </span> 
  <span class="audit-date">Expire le<br/> ${formatTime(audit.end)}</span>

  <div class="audit-plus" style="background-color:${subColors.bg}">
  <span class="capitalize">${audit.project}</span>
  <b>${captain.firstName} ${captain.lastName}</b>
  <br/>${memberList}
  </div>
  </div>`;

  return auditData;
}

function buildCurrentProjectHTML(project, index) {
  const getColor = createColorPalette();
  const color = getColor(index);
  const subColors = getColor(index, true, index + 1);

  let auditorList = ``;
  project.auditors.forEach((auditor) => {
    auditorList += `${auditor.login}<br/>`;
  });

  const projectData = `<div class="audit-bloc" title="${project.name} - ${project.captain.login}" 
  style="background-color:${color.bg};color:${color.isLight ? "var(--dusk-blue)" : "var(--pale-sky)"}"
  >
  <span class="audit-project" style="background-color:${subColors.bg}">${project.name}</span><i data-lucide="badge-plus"></i>
  <span class="audit-captain" style="background-color:${subColors.bg}">${project.captain.login} </span>
  <span class="audit-count" style="border-color:${subColors.bg}">${project.count} / 5
  </span> 
  <span class="audit-date">Terminé ${project.start == "Aujourd'hui" || project.start == "Hier" ? "" : "le"}<br/> ${project.start}</span>
  <div class="audit-plus" style="background-color:${subColors.bg}">
  <span class="capitalize"><b>${project.name}</b></span>
  ${auditorList}
  </div>
  </div>`;

  return projectData;
}

async function getMyCurrentProject(workload, jwtoken) {
  let currentProjects = [];
  for (const project of workload) {
    let projectData;

    if (!project.object.progresses || !project.object) continue;

    if (
      !project.object.progresses[0].isDone &&
      project.object.type == "project"
    ) {
      const auditorData = await getAuditors(
        project.object.progresses[0].group.id,
        jwtoken,
      );

      let validAudits = 0;
      let filterAuditors = [];

      auditorData.data.audit[0].group.auditors.forEach((auditor) => {
        if (auditor.closureType == "succeeded") {
          validAudits++;
        } else if (auditor.closureType == null) {
          filterAuditors.push(auditor);
        }
      });

      let auditors = [];

      filterAuditors.forEach((auditor) => {
        auditors.push({ login: auditor.auditorLogin, id: auditor.id });
      });

      const captain = {
        login: project.object.progresses[0].group.captain.login,
        firstName: project.object.progresses[0].group.captain.firstName,
        lastName: project.object.progresses[0].group.captain.lastName,
      };

      projectData = {
        name: formatProjectName(project.object).name,
        start: formatTime(project.createdAt),
        count: validAudits,
        captain: captain,
        auditors: auditors,
      };
      currentProjects.push(projectData);
    }
  }

  if (currentProjects.length <= 0) return ``;

  const uniqueProjects = [
    ...new Map(currentProjects.map((item) => [item.name, item])).values(),
  ];

  let HTMLbloc = ``;

  uniqueProjects.forEach((project, index) => {
    HTMLbloc += buildCurrentProjectHTML(project, index);
  });

  return HTMLbloc;
}

export {
  buildLevelTable,
  getRankName,
  formatTime,
  getSkillTotal,
  classifySkills,
  createSkillLogo,
  createHTMLSkill,
  buildQuarters,
  buildProjectData,
  buildTreemapTile,
  formatProjectName,
  isSoloProject,
  countProjectsByCoworker,
  filterProjectByType,
  buildAuditData,
  getMyCurrentProject,
  isTokenExpired,
};
