# MCO Quiz Arena V5 — GitHub Pages + Supabase

Version prête à être installée **manuellement** par toi, sans plugin ni connexion ChatGPT.

## Ce que contient le pack

- `docs/` : application statique à publier avec **GitHub Pages**.
- `supabase/001_schema.sql` : schéma, sécurité et fonctions RPC live.
- `supabase/002_seed_questions.sql` : banque complète de **1 620 questions**.
- `docs/data/curriculum.json` : **156 leçons** / 52 chapitres.
- `docs/assets/icons/` : pack d'icônes PWA haute définition.
- `docs/assets/branding/` : source HD, mascotte, logo NCR et référence graphique validée.

## Architecture

GitHub Pages sert uniquement l'interface. Supabase stocke les parties, joueurs, réponses, scores et classements.

Le navigateur n'utilise qu'une **clé Supabase publishable/anon**. La clé `service_role` ne doit jamais être placée dans GitHub.

## Installation rapide

Lis `INSTALLATION_GITHUB_SUPABASE.md`.
