import { DOMAIN } from "./authentication.js";

/**
 * Envoie les requêtes GraphQL à l'API
 * @param {string} query La requête à envoyer à l'API GRaphQL
 * @param {jwt} jwtoken Le token de connexion
 * @returns
 */
/**
 * Envoie les requêtes GraphQL à l'API
 * @param {string} query
 * @param {object} variables - Les variables pour la query
 * @param {jwt} jwtoken
 */
async function fetchFromDomain(query, variables, jwtoken) {
  const response = await fetch(
    `https://${DOMAIN}/api/graphql-engine/v1/graphql`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtoken}`,
        "Content-Type": "application/json",
      },
      // Nous incluons maintenant 'variables' dans le body
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    },
  );

  if (!response.ok) {
    alert("Erreur de récupération des données");
    return;
  }

  return await response.json();
}

/**
 * Formule la query pour récupérer les informations de base de l'utilisateur
 * @param {token} jwtoken Le token de connexion
 */
async function getUserInfo(jwtoken) {
  const query = `
  query GetUser {
    user {
    id
    login
    firstName
    lastName
    avatarUrl
    createdAt

    labels {
    labelName
    }
    
    level: transactions(
      where: { 
        type: { _eq: "level" }, 
        path: { _like: "%div-01%" } 
      }
      order_by: { amount: desc }
      limit: 1
    ) {
      amount
    }

    skills: transactions (
    where: {
    type: {_like: "%skill%"}
    }
    order_by: {amount:desc}
    ) {
    type
    amount
      object {
        name
        attrs        
      }
    }
      
    xp: transactions_aggregate(
    where: {
        type: { _eq: "xp" }
        path: { _like: "%div-01%", _nlike: "%piscine%/%" }
    }
    ) {
    aggregate {
        sum {
            amount
        }
  }
}
      
   events(where: { event: { path: { _like: "%div-01%" } } }) {
   createdAt
        event {
          id
          campus
          cohorts {
            name
          }
        }
      }
    }
  }
`;

  return await fetchFromDomain(query, {}, jwtoken);
}

/**
 * Formule la query pour récupérer l'xp et toutes les informations statistiques de l'utilisateur
 * @param {string} userID Identifiant de l'utilisateur dans l'API
 * @param {token} jwtoken Le token de connexion
 */
async function getUserDashboard(userID, jwtoken) {
  const query = `query GetUserActivity($userID: Int!) {
    transaction(where: { userId: { _eq: $userID } }) {
      type
      amount
      objectId
      createdAt
      path
    }

    progress(where: { userId: { _eq: $userID } }) {
      objectId
      grade
      createdAt
      updatedAt
      path
    }
    result(where: {userId : {_eq:$userID}}) {
      objectId	
      grade	
      type	
      createdAt	
      updatedAt	
      path
    }
    object {
      name	
      type	
      attrs
    }
  }`;

  const progressData = await fetchFromDomain(query, { userID }, jwtoken);
  console.log("Dashboard Data:", progressData);
}

export { getUserInfo, getUserDashboard };
