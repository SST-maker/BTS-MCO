# MCO Quiz Arena V5.6 — Avatar Studio+

Cette version étend la V5.5 avec une personnalisation beaucoup plus riche des avatars élèves, sans photo personnelle et sans Supabase Storage.

## Nouveautés

- 9 coiffures : sans cheveux, courts, pics, mèche, boucles, afro, dégradé, longs, queue haute.
- 6 couleurs de cheveux : graphite, châtain, caramel, blond, argent, bleu MCO.
- 8 lunettes : aucune, soleil, miroir bleu, rondes, rétro, aviateur, gaming, néon.
- 8 chapeaux : aucun, casquette, bonnet, bob, chapeau, diplômé, cow-boy, toque.
- Bouton **Surprends-moi** pour générer une combinaison aléatoire.
- Règles automatiques pour éviter les doubles couvre-chefs disgracieux.
- Les avatars restent 100 % SVG et s'affichent dans l'espace élève, les lives, les classements et le podium.
- Plus de 12 millions de combinaisons théoriques avec les options déjà existantes.

## Mise à jour depuis V5.5

1. Dans Supabase, exécuter `014_avatar_studio_plus.sql`.
2. Facultatif : exécuter `015_verifier_v5_6.sql`.
3. Mettre à jour les fichiers GitHub avec le ZIP public V5.6.
4. Conserver le `docs/config.js` déjà configuré.

Aucune table supplémentaire ni Storage n'est nécessaire : tout reste stocké dans `mco_students.avatar` au format JSONB.
