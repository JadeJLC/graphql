const DOMAIN = "zone01normandie.org";
import { createPage } from "./html-creation.js";

/**
 * Récupère les données dans l'API graphQL pour les afficher sur la page
 * @param {token} jwtoken Le token de connexion pour récupérer les données de l'utilisateur
 */
async function getGraphQLPage(jwtoken) {
  const query = `
  query GetUser {
    user {
    login
    }
  }
`;
  const response = await fetch(
    `https://${DOMAIN}/api/graphql-engine/v1/graphql`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtoken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: query }),
    },
  );

  if (!response.ok) {
    alert("Erreur de récupération des données");
    return;
  }

  const data = await response.json();

  createPage(data);
}

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
function logInSuccess(jwtoken) {
  console.log("Connexion en cours");
  const alertZone = document.getElementById("login-alert");
  if (alertZone) alertZone.classList.add("is-hidden");

  const loginPage = document.getElementById("login-page");
  if (loginPage) loginPage.classList.add("is-hidden");

  const dashbooard = document.getElementById("dashboard-page");
  if (dashbooard) {
    dashbooard.classList.remove("is-hidden");
    getGraphQLPage(jwtoken);
  }

  localStorage.setItem("jwt", jwtoken);
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
  logoutBtn.classList.add("is-hidden");
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
  } else if ((passInput.type = "text")) {
    showPassBtn.dataset.lucide = "eye";
    showPassZone.title = showPassZone.alt = "Afficher le mot de passe";
    passInput.type = "password";
    lucide.createIcons();
  }
}

export { logInSuccess, sendFormData, logOut, showHidePassword };
