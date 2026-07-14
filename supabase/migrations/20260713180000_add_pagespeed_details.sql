/*
  # Ajout des scores PageSpeed détaillés

  1. Modifications
    - `contacts.pagespeed_details` (jsonb, nullable)
      Structure : { "mobile": { "performance": 90, "accessibility": 95, "best_practices": 100, "seo": 92 },
                    "desktop": { ... }, "checked_at": "2026-07-13T..." }

  2. Notes
    - Les colonnes existantes pagespeed_mobile / pagespeed_desktop restent la note Performance
      (compatibilité avec la liste des contacts et l'import CSV).
*/

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pagespeed_details jsonb;
