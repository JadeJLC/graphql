import { getUserDashboard, getUserInfo } from "./getdata.js";

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

  lucide.createIcons();
}

function createProfileBloc(user) {
  const profileSection = document.getElementById("user-profile");
  const rank = getRankName(user.transactions[0].amount);
  const promoEvent = user.events.find((e) => e.event?.cohorts?.length > 0);
  const promoName = user.labels[0].labelName;
  // const promoName = promoEvent?.event?.cohorts?.[0]?.name ?? "Promo inconnue";
  const signin = formatTime(promoEvent?.createdAt ?? user.createdAt);
  console.log(signin);

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

function createLevelBloc(user) {
  const levelSection = document.getElementById("user-exp");
  const currentXP = user.xp.aggregate.sum.amount;
  const currentLevel = user.transactions[0].amount;

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

export { createPage };

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
