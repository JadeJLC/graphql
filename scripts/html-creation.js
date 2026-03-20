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
  createSVGLineChart,
} from "./helpers.js";
import { animateXPGraph } from "./animation.js";

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
  createAuditRatioBloc(user);
  createXPProgressBloc(user);

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
  const currentLvl = user.level[0].amount;

  const xpData = buildLevelTable();

  const currentEntry = xpData[currentLvl];
  const prevEntry = xpData[currentLvl - 1];

  const xpToNext = (xpData[currentLvl].cumul - currentXP).toLocaleString(
    "fr-FR",
  );
  const xpIntoLevel = currentXP - prevEntry.cumul;
  const progress = (xpIntoLevel / currentEntry.total) * 100;

  levelSection.innerHTML = `
            <h3 class="bloc-title">Expérience (XP)</h3>
            <div class="bloc-xp">Niveau actuel : ${currentLvl}</div>
            <div class="bloc-infos">
              <div class="progress-bar">
                <div></div>
              </div>
              <span class="subtitle">${currentXP.toLocaleString("fr-FR")} / ${currentEntry.cumul.toLocaleString("fr-FR")} xp</span>
            </div>
            <div class="bloc-infos next-level">Prochain niveau dans ${xpToNext.toLocaleString("fr-FR")} xp</div>
          `;

  setTimeout(() => {
    const progressBarInner = document.querySelector(".progress-bar > div");
    progressBarInner.style.width = `${progress}%`;
  }, 50);
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

/**
 * Génère le bloc contenant le graphique de ratio d'audit
 * @param {GraphQL data} user  Les données de l'utilisateur
 * @returns
 */
function createAuditRatioBloc(user) {
  const ratio = {
    given: user.totalUp + user.totalUpBonus,
    received: user.totalDown,
    total: user.totalUp + user.totalUpBonus + user.totalDown,
  };

  if (ratio.total == 0) return;

  createSVGPieChart(ratio);

  const receivedZone = document.getElementById("received-xp");
  const givenZone = document.getElementById("given-xp");
  const ratioTitle = document.getElementById("ratio-count");

  receivedZone.innerHTML = `XP reçue<br/> <span>${ratio.received.toLocaleString("fr-FR")}</span>`;
  givenZone.innerHTML = `XP donnée<br/> <span>${ratio.given.toLocaleString("fr-FR")}</span>`;

  const totalRatio = ratio.received > 0 ? ratio.given / ratio.received : 0;
  ratioTitle.innerHTML = `Ratio d'audit (${totalRatio.toFixed(2)})`;
}

function createXPProgressBloc(user) {
  let currentXP = 0;
  const transactions = user.progress.map((xp) => ({
    date: xp.createdAt,
    xp: (currentXP += xp.amount),
    project: xp.object?.name ?? "—",
    projectxp: xp.amount,
  }));

  createSVGLineChart(transactions);

  const svgEl = document.getElementById("xp-graph");
  if (!svgEl || !transactions.length) return;

  const { svg, points } = createSVGLineChart(transactions);
  svgEl.innerHTML = svg;

  animateXPGraph(svgEl);
  setTimeout(() => {
    svgEl.querySelectorAll(".xp-dot-vis").forEach((dot) => {
      dot.style.opacity = "0.8";
    });
  }, 1500);

  const details = document.getElementById("xp-details");

  svgEl.querySelectorAll(".xp-dot").forEach((dot, i) => {
    const { name, xp, projectxp } = points[i];

    dot.addEventListener("mouseenter", () => {
      dot.previousElementSibling.setAttribute("opacity", "1");
      if (details)
        details.textContent = `${name} — ${projectxp.toLocaleString("fr-FR")} xp`;
    });

    dot.addEventListener("mouseleave", () => {
      dot.previousElementSibling.setAttribute("opacity", ".8");
      if (details) details.textContent = "Survolez un projet pour les détails";
    });
  });
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
