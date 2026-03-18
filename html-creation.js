/**
 * Transforme la page HTML avec les données récupérées
 * @param {graphQLRequest / string} response Soit "logout" pour la déconnexion, soit les données récupérées en graphQL
 * @returns
 */
function createPage(response) {
  if (response === "logout") {
    displayUsername();
    displayLoginPage();
    return;
  }

  const username = response.data.user[0].login;
  displayUsername(username);
}

/**
 * Affiche le nom d'utilisateur dans le header
 * @param {string} username
 */
function displayUsername(username) {
  const nameZone = document.getElementById("header-username");

  if (username) {
    nameZone.innerHTML = `Connecté en tant que ${username}`;
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.classList.remove("is-hidden");
  } else {
    nameZone.innerHTML = "";
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
