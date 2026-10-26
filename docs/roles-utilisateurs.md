# Profils utilisateurs Nyateƒe

## Combien de types de comptes ?

Trois profils suffisent pour le MVP :

| Profil | Nombre | Rôle |
|--------|--------|------|
| **Citoyen** | Illimité (public) | Poser des questions à l’assistant juridique (RAG) |
| **Cabinet juridique** | Illimité (inscription dédiée) | Citoyen + bibliothèque sémantique + rédaction assistée (brouillon) |
| **Administrateur** | Petite équipe (1 à quelques personnes) | Cabinet + publication des textes dans le corpus |

Un **administrateur** est nécessaire pour alimenter la base vectorielle (équivalent métier de « publier / indexer les lois »). Les citoyens et cabinets **consomment** la base ; ils ne vectorisent pas les documents en production.

## Matrice des fonctionnalités

| Fonctionnalité | Citoyen | Cabinet | Admin |
|----------------|---------|---------|-------|
| Landing publique | Oui | Oui | Oui |
| Connexion / inscription | Oui | Oui | Oui (code invitation) |
| Tableau de bord | Oui | Oui | Oui |
| Assistant juridique (chat RAG) | Oui | Oui | Oui |
| Bibliothèque (recherche sémantique) | Non | Oui | Oui |
| Rédaction assistée | Non | Oui | Oui |
| Indexation `POST /api/documents` | Non | Non | Oui (UI + clé serveur) |

## Indexation vectorielle (admin)

1. L’administrateur se connecte avec un compte **admin** (créé par l’équipe technique, pas via l’inscription publique).
2. Il ouvre **Indexation des textes** et saisit titre, type, référence, date et corps du texte.
3. L’API envoie chaque chunk à Ollama (`nomic-embed-text`) et enregistre dans `legal_chunks`.
4. La clé `INGEST_API_KEY` reste exigée côté serveur (en plus du rôle UI).

## État technique actuel

- **Frontend** : sessions MVP (navigateur, `localStorage` / `sessionStorage`). À remplacer par authentification serveur (JWT ou session Flask) avant production ouverte.
- **Backend** : pas encore de table `users` ; seule la clé d’indexation protège `/api/documents`.

## Prochaines étapes recommandées

1. Backend auth (PostgreSQL `users`, rôles, hash mot de passe).
2. Lier le rôle **admin** à la clé d’indexation (une seule porte d’entrée).
3. OAuth ou e-mail institutionnel pour les cabinets (Barreau de Lomé).
