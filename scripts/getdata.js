import { DOMAIN } from "./authentication.js";
import { isTokenExpired } from "./helpers.js";
import { APIdata } from "./init.js";
import { loadPageData } from "./authentication.js";

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
    totalDown
    totalUp
    totalUpBonus

    labels {
    labelName
    }

    audits(where:{closedAt: {_is_null:true}}) {
    
        endAt
        private {
          code
        }
        group {
          object {
            name
            type
          }
          members {
            user {
              login
              firstName
              lastName
            }
          }
          captain {
            login
            firstName
            lastName
          }
        }
        
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

    progress : transactions (
    where: {
    type: {_like: "%xp%"},
    path: { _like: "%div-01%", _nlike: "%piscine%/%" }
    }
    ) {
    createdAt
    amount
      object  {
        id
        createdAt
        name
        type
        attrs
      }
    }

    
    workload : transactions (
    where: {
    type: { _nregex: "^(level|skill|xp)" },
    path: { _like: "%div-01%", _nlike: "%piscine%/%" }
    }
    ) {
    createdAt
      object  {
        name
        type
        
        progresses{
          isDone
          group {
          id
            members {
              user {
              firstName
              lastName
              login
              }
            }
            captain {
            firstName
            lastName
            login
            }
          }
        }
      }
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

async function getAuditors(groupId, jwtoken) {
  const query = `query GetAuditors($groupId: Int!) { 
     audit (where: {groupId : {_eq: $groupId} }) {
      group {
        id
         auditors {
          id
          auditorId
          auditorLogin
          closureType
        }
      }
    }
  }`;

  return await fetchFromDomain(query, { groupId }, jwtoken);
}

async function getGroupMembers(groupIds, jwtoken) {
  const query = `query GetGroupMembers($groupIds: [Int!]!) {
  object(where: { id: { _in: $groupIds } }) {
    id
    results {
      group {
        members {
          user {
            login
            firstName
            lastName
          }
        }
      }
    }
  }
}`;

  return await fetchFromDomain(query, { groupIds }, jwtoken);
}

async function checkApiUpdates() {
  console.log("Recherche de mises à jour");
  const jwtoken = localStorage.getItem("jwt");

  if (isTokenExpired(jwtoken)) return;

  const query = `query checkUpdates {
    user {      
    totalDown
    totalUp

    audits(where:{closedAt: {_is_null:true}}) {
        endAt  
      group {
        id
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

}
  }`;

  const reponse = await fetchFromDomain(query, {}, jwtoken);

  const XP = reponse.data.user[0].xp.aggregate.sum.amount;
  const ratioUp = reponse.data.user[0].totalUp;
  const ratioDown = reponse.data.user[0].totalDown;

  if (
    XP != APIdata.currentxp ||
    ratioDown != APIdata.currentDown ||
    ratioUp != APIdata.currentUp
  ) {
    console.log("Nouvelles données. Rechargement de la page.");
    loadPageData(jwtoken);
  }

  if (reponse.data.user[0].audits.length != APIdata.auditsToDo) {
    if (Notification.permission === "granted") {
      new Notification("Nouvel audit à faire", {
        body: "Une nouvelle demande d'audit est arrivée. Le code de validation est disponible sur votre tableau de bord",
        icon: "../favicon.ico",
      });
    }
    loadPageData(jwtoken);
  }
}

export {
  getUserInfo,
  getGroupMembers,
  getAuditors,
  fetchFromDomain,
  checkApiUpdates,
};
