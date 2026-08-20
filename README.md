# NCR Solutions — MCO Quiz Arena V3

## État de cette version
Cette V3 réunit **le système complet et la banque exhaustive issue des supports V18**.

### Déjà fonctionnel
- Accueil premium NCR / BTS MCO
- Icône d'app dérivée du robot NCR
- Mode Professeur
- Création de partie avec filtres niveau / matière / chapitre / leçon / difficulté
- Modes Classe, Battle, Révision, BTS et Duel
- Code de partie à 5 caractères
- QR code dynamique et réellement scannable
- Connexion élève par téléphone avec pseudo
- Lobby temps réel par polling
- Questions et réponses colorées
- Chronomètre
- Score de rapidité + séries
- Révélation de correction pédagogique
- Classement live
- Duel avec équipes Bleu / Orange
- Fin de partie + podium
- Export CSV professeur
- Mode Solo
- Banque structurée et consultable
- PWA / manifest / service worker

### Banque actuelle
**1 620 questions** disponibles : **1 560 questions issues des 156 leçons V18 (10 par leçon)** + **60 questions manuelles complémentaires** pour les calculs, réflexes et tests fonctionnels.

La banque complète a été injectée depuis les cours PowerPoint V18 et structurée par :

`Niveau → Matière → Chapitre → Leçon → Difficulté → Question → Réponses → Correction → Piège BTS / notion`

## Démarrage sur Mac
Double-clique sur `START_MCO_QUIZ.command`.

Sinon dans Terminal :

```bash
cd MCO_Quiz_Arena_V3_BANQUE_COMPLETE
node server.js
```

Le terminal affiche :
- une adresse locale : `http://localhost:4173`
- une ou plusieurs adresses réseau : `http://192.168.x.x:4173`

Pour que les élèves rejoignent depuis leurs téléphones sur le même Wi-Fi, ouvre la page professeur avec **l'adresse Réseau**, pas localhost. Le QR code utilisera alors cette adresse.

## Important avant production
Cette V3 stocke les parties en mémoire du serveur. Si le serveur redémarre, les sessions en cours disparaissent. Pour un déploiement Internet permanent, la phase de mise en production ajoutera un stockage persistant et une authentification professeur.
