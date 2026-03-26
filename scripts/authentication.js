const DOMAIN = "zone01normandie.org";
import { createPage } from "./html-creation.js";
import { getUserInfo, checkApiUpdates } from "./getdata.js";

/**
 * Fonction principale de connexion : récupère les identifiants et les envoie à l'API
 * @param {string} encodedData Les éléments d'authentification codés en base64
 */
async function logIn(encodedData) {
  const response = await fetch(`https://${DOMAIN}/api/auth/signin/`, {
    method: "POST",
    headers: { Authorization: encodedData },
  });

  if (!response.ok) {
    logInFailed();
    return;
  }
  const jwtoken = await response.json();

  if (!jwtoken) {
    logInFailed();
    return;
  }
  logInSuccess(jwtoken);
}

/**
 * Affiche le tableau de bord une fois la connexion réussie
 * @param {token} jwtoken Le token de connexion pour récupérer les données de l'utilisateur
 */
async function logInSuccess(jwtoken) {
  await Notification.requestPermission();

  setInterval(() => {
    checkApiUpdates();
  }, 60000);

  console.log("Connexion en cours");
  const alertZone = document.getElementById("login-alert");
  if (alertZone) alertZone.classList.add("is-hidden");

  const loginPage = document.getElementById("login-page");
  if (loginPage) loginPage.classList.add("is-hidden");

  const loading = document.getElementById("loading");

  if (loading) loading.classList.remove("is-hidden");

  loadPageData(jwtoken);

  localStorage.setItem("jwt", jwtoken);
}

async function loadPageData(jwtoken) {
  const dashbooard = document.getElementById("dashboard-page");
  if (dashbooard) {
    const userData = await getUserInfo(jwtoken);

    if (userData.errors) {
      logOut();
      if (loading) loading.classList.add("is-hidden");
      return;
    }

    loading.classList.add("is-hidden");
    dashbooard.classList.remove("is-hidden");

    createPage(userData, jwtoken);
  }
}

/**
 * Affichage de la notification en cas d'erreur de connexion
 */
function logInFailed() {
  const alertZone = document.getElementById("login-alert");
  alertZone.classList.remove("is-hidden");
}

/**
 * Déconnexion : Supprime le JWToken et raffiche la page de connexion
 * @param {HTMLElement} logoutBtn
 */
function logOut(logoutBtn) {
  if (logoutBtn) logoutBtn.classList.add("is-hidden");
  createPage("logout");

  localStorage.removeItem("jwt");
}

/**
 * Récupération des données du formulaire pour l'authentification
 * @param {HTMLElement} form Le formulaire d'inscription
 */
function sendFormData(form) {
  const username = form.identifier.value;
  const encodedData =
    "Basic " + window.btoa(`${username}:${form.password.value}`);

  logIn(encodedData);
}

/**
 * Fonction pour afficher ou masquer le mot de passe dans le champ de connexion
 */
function showHidePassword() {
  const showPassZone = document.getElementById("show-password-zone");
  const showPassBtn = document.getElementById("show-password");
  const passInput = document.getElementById("password");

  if (passInput.type == "password") {
    showPassBtn.dataset.lucide = "eye-off";
    showPassZone.title = showPassZone.alt = "Masquer le mot de passe";
    passInput.type = "text";
    lucide.createIcons();
  } else if (passInput.type == "text") {
    showPassBtn.dataset.lucide = "eye";
    showPassZone.title = showPassZone.alt = "Afficher le mot de passe";
    passInput.type = "password";
    lucide.createIcons();
  }
}

export {
  logInSuccess,
  sendFormData,
  logOut,
  showHidePassword,
  DOMAIN,
  loadPageData,
};
