import { getUserDashboard } from "./getdata.js";
import {
  buildLevelTable,
  getRankName,
  formatTime,
  getSkillTotal,
  classifySkills,
  createSkillLogo,
  createHTMLSkill,
  createSVGPieChart,
} from "./helpers.js";

/**
 * Transforme la page HTML avec les données récupérées
 * @param {graphQLRequest / string} response Soit "logout" pour la déconnexion, soit les données récupérées en graphQL
 * @returns
 */
async function createPage(response, jwtoken) {
  console.log("User Data : ", response);
  if (response === "logout") {
    createProfilePage();
    displayLoginPage();
    return;
  }

  const userData = response.data.user[0];
  const userID = response.data.user[0].id;
  createProfilePage(userData);

  getUserDashboard(userID, jwtoken);
}

/**
 * Affiche les infos de l'utilisateur sur son tableau de bord
 * et dans le header
 * @param {object} user Les informations de l'utilisateur
 */
function createProfilePage(user) {
  const headername = document.getElementById("header-username");

  if (user) {
    headername.innerHTML = `Utilisateur connecté : ${user.firstName} ${user.lastName} (${user.login})`;
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.classList.remove("is-hidden");
  } else {
    headername.innerHTML = "";
  }

  createProfileBloc(user);
  createLevelBloc(user);
  createSkillBloc(user);
  createAuditRatioPieChart(user);

  lucide.createIcons();
}

/**
 * Génère le bloc "informations personnelles" du tableau de bord
 * @param {GraphQL data} user Les données de l'utilisateur envoyées par le GraphQL
 */
function createProfileBloc(user) {
  const profileSection = document.getElementById("user-profile");
  const rank = getRankName(user.level[0].amount);
  const promoEvent = user.events.find((e) => e.event?.cohorts?.length > 0);
  const signin = formatTime(promoEvent?.createdAt ?? user.createdAt);

  const promoName = user.labels[0].labelName;

  profileSection.innerHTML = `
  <h3 class="bloc-title">Informations personnelles</h3>
            <div class="profile-data">
               <img src="${user.avatarUrl ? user.avatarUrl : "default.png"}" alt="Avatar de l'utilisateur" />
              <div>
                <div class="bloc-username">${user.firstName} ${user.lastName}</div>
                <div class="bloc-infos">
                <i data-lucide="bookmark"></i>
                ${promoName}</div>
                <div class="bloc-infos">
                <i data-lucide="award"></i>
                ${rank}</div>
                <div class="bloc-infos">
                  <i data-lucide="calendar-check"></i>
                  ${signin}
                </div>
              </div>
            </div>`;
}

/**
 * Génère le bloc "Expérience et niveau" du tableau de bord
 * @param {GraphQL data} user Les données de l'utilisateur envoyées par le GraphQL
 */
function createLevelBloc(user) {
  const levelSection = document.getElementById("user-exp");
  const currentXP = user.xp.aggregate.sum.amount;
  const currentLevel = user.level[0].amount;

  const jn = buildLevelTable();

  const currentEntry = jn[currentLevel];
  const prevEntry = jn[currentLevel - 1];

  const xpToNext = (jn[currentLevel].cumul - currentXP).toLocaleString("fr-FR");
  const xpIntoLevel = currentXP - prevEntry.cumul;
  const progress = (xpIntoLevel / currentEntry.total) * 100;

  levelSection.innerHTML = `
            <h3 class="bloc-title">Expérience (XP)</h3>
            <div class="bloc-xp">Niveau actuel : ${currentLevel}</div>
            <div class="bloc-infos">
              <div class="progress-bar">
                <div style="width: ${progress}%"></div>
              </div>
              <span class="subtitle">${currentXP.toLocaleString("fr-FR")} / ${currentEntry.cumul.toLocaleString("fr-FR")} xp</span>
            </div>
            <div class="bloc-infos next-level">Prochain niveau dans ${xpToNext.toLocaleString("fr-FR")} xp</div>
          `;
}

/**
 * Génère le bloc "Compétences" du tableau de bord
 * @param {GraphQL data} user Les données de l'utilisateur envoyées par le GraphQL
 */
function createSkillBloc(user) {
  const skills = getSkillTotal(user.skills);
  const keys = Object.keys(skills);
  let techSkills = [];
  let languages = [];

  keys.forEach((key) => {
    if (classifySkills(key)) {
      languages.push({
        name: key,
        value: skills[key],
        logo: createSkillLogo(key),
      });
    } else {
      techSkills.push({
        name: key,
        value: skills[key],
        logo: createSkillLogo(key),
      });
    }
  });

  const skillBloc = document.getElementById("user-skills");

  const techSkillBloc = createHTMLSkill(techSkills);
  const langSkillBloc = createHTMLSkill(languages);

  skillBloc.innerHTML = `<h3 class="bloc-title">Compétences</h3>
            <div class="bloc-xp">Techniques</div>
            <div class="bloc-infos">${techSkillBloc}</div>

            <div class="bloc-xp">Langages et environnements</div>
            <div class="bloc-infos lang">${langSkillBloc}</div>
          </div>`;
}

function createAuditRatioPieChart(user) {
  const ratio = {
    given: user.totalUp + user.totalUpBonus,
    received: user.totalDown,
  };

  const total = ratio.given + ratio.received;
  if (total === 0) return;

  const ratioChart = document.getElementById("ratio-chart");
  ratioChart.innerHTML = "";

  const slices = [
    {
      className: "audit-given",
      value: ratio.given,
      color: "var(--violet)",
      labelId: "given-xp",
    },
    {
      className: "audit-received",
      value: ratio.received,
      color: "var(--pale-sky)",
      labelId: "received-xp",
    },
  ];

  let currentStartPercent = 0;
  const radius = 45;
  const cx = 50;
  const cy = 50;

  slices.forEach((slice) => {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    const percent = (slice.value / total) * 100;
    const pathData = createSVGPieChart(
      percent,
      currentStartPercent,
      radius,
      cx,
      cy,
    );

    element.setAttribute("d", pathData);
    element.setAttribute("fill", slice.color);
    element.classList.add(slice.className);
    element.setAttribute("stroke", "var(--border-shine)");
    element.setAttribute("stroke-width", "0.8");

    // LINKING LOGIC: Find the span by ID
    const label = document.getElementById(slice.labelId);

    element.addEventListener("mouseenter", () => {
      label.classList.add("active");
      ratioChart.appendChild(element); // Keep hovered slice on top
    });

    element.addEventListener("mouseleave", () => {
      label.classList.remove("active");
    });

    currentStartPercent += percent;
    ratioChart.appendChild(element);
  });

  // Your existing title updates
  const givenTitle = document.getElementById("given-xp");
  const receivedTitle = document.getElementById("received-xp");

  receivedTitle.innerHTML = `XP reçue<br/> <span>${ratio.received.toLocaleString("fr-FR")} </span>`;
  givenTitle.innerHTML = `XP donnée<br/> <span>${ratio.given.toLocaleString("fr-FR")} </span>`;

  const totalRatio = ratio.given / ratio.received;
  const ratioZone = document.getElementById("ratio-count");
  ratioZone.innerHTML = `Ratio d'audit (${Math.round(totalRatio * 100) / 100})`;
}

/**
 * Affiche la page de connexion
 */
function displayLoginPage() {
  const dashbooard = document.getElementById("dashboard-page");
  if (dashbooard) {
    dashbooard.classList.add("is-hidden");
  }

  const loginPage = document.getElementById("login-page");
  if (loginPage) loginPage.classList.remove("is-hidden");
}

export { createPage };
