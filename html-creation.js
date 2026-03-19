import { getUserDashboard, getUserInfo } from "./getdata.js";

/**
 * Transforme la page HTML avec les données récupérées
 * @param {graphQLRequest / string} response Soit "logout" pour la déconnexion, soit les données récupérées en graphQL
 * @returns
 */
async function createPage(response, jwtoken) {
  if (response === "logout") {
    displayUserInfo();
    displayLoginPage();
    return;
  }

  const user = response.data.user[0];
  const userID = response.data.user[0].id;
  displayUserInfo(user);

  getUserDashboard(userID, jwtoken);
}

/**
 * Affiche les infos de l'utilisateur sur son tableau de bord
 * et dans le header
 * @param {string} user Les informations de l'utilisateur
 */
function displayUserInfo(user) {
  const headername = document.getElementById("header-username");

  if (username) {
    headername.innerHTML = `Connecté en tant que ${user.login}`;
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.classList.remove("is-hidden");
  } else {
    headername.innerHTML = "";
  }
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
