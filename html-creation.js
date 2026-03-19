import { getUserDashboard } from "./getdata.js";
import { buildLevelTable, getRankName, formatTime } from "./helpers.js";

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
  const promoName = user.labels[0].labelName;

  const signin = formatTime(promoEvent?.createdAt ?? user.createdAt);

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

  // Reste à faire : classifier les compétences entre tech et langage
  // Créer l'élément HTML avec des jolis "logos" pour chaque compétence
}

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

  console.log(skillLevel);
  console.log(keys);
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
