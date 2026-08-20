# Supabase

Ordre d'exécution :

1. `001_schema.sql`
2. `002_seed_questions.sql`

Après l'import :

```sql
select count(*) from public.quiz_questions;
```

Résultat attendu : `1620`.

Pour effacer manuellement les anciennes sessions après test :

```sql
select public.mco_cleanup_old_sessions(1);
```

Cette fonction n'est pas accessible depuis le navigateur.
