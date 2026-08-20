# NCR Solutions — MCO Quiz Arena V4

Cette V4 reprend le moteur et la banque V3, mais applique l'identité visuelle validée : **blanc / bleu NCR / bleu marine / accent jaune**, interface professeur claire, robot-mascotte, écrans mobiles élèves et icône PWA.

## Fonctionnalités incluses
- Tableau de bord professeur clair
- Création de quiz par niveau / matière / chapitre / leçon / difficulté
- Modes Classe, Battle, Révision, BTS et Duel
- Code de partie à 5 caractères
- QR code dynamique réellement scannable
- Connexion élève sans compte
- Lobby temps réel
- Écran question projetable
- Écran réponse mobile coloré
- Chronomètre
- Score de rapidité + séries
- Correction pédagogique après révélation
- Classement live
- Podium final
- Export CSV des résultats
- Mode révision Solo
- Banque pédagogique structurée
- PWA installable
- Icônes : 64 / 180 / 192 / 512 + maskable 512
- Responsive ordinateur / tablette / smartphone

## Banque
**1 620 questions** déjà incluses, issues des supports BTS MCO V18 et de la banque manuelle complémentaire.

Structure :
`Niveau → Matière → Chapitre → Leçon → Difficulté → Question → Réponses → Correction`

## Démarrer sur Mac
Double-cliquer sur :
`START_MCO_QUIZ.command`

Ou dans Terminal :
```bash
cd MCO_Quiz_Arena_V4_DESIGN_OFFICIEL
node server.js
```

Puis ouvrir l'adresse affichée :
- Professeur sur le Mac : `http://localhost:4173`
- Élèves : utiliser l'adresse **Réseau** affichée dans le terminal, ou scanner le QR code du lobby.

## Important
Les parties sont stockées en mémoire : un redémarrage du serveur efface les sessions actives. La banque de questions reste bien dans les fichiers. Pour un hébergement Internet permanent, il faudra ensuite ajouter stockage persistant + authentification professeur.
