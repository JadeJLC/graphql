import {
  logInSuccess,
  sendFormData,
  logOut,
  showHidePassword,
} from "./authentication.js";

document.addEventListener("DOMContentLoaded", init);

/**
 * Fonction lancer une fois la page chargée
 */
function init() {
  lucide.createIcons();
  const jwtoken = localStorage.getItem("jwt");

  if (jwtoken) {
    logInSuccess(jwtoken);
  }

  setEventListeners();
}

/**
 * Mise en place des éléments au clic :
 * Afficher / Masquer le mot de passe
 * Soumission du formulaire de connexion
 * Bouton de déconnexion
 */
function setEventListeners() {
  document.addEventListener("click", (event) => {
    const passBtn = event.target.closest("#show-password-zone");
    if (passBtn) showHidePassword();

    const logoutBtn = event.target.closest("#logout-btn ");
    if (logoutBtn) logOut(logoutBtn);
  });

  document.addEventListener("submit", (event) => {
    const loginForm = event.target.closest("#login-page");
    if (loginForm) {
      event.preventDefault();
      sendFormData(loginForm, event);
    }
  });
}
