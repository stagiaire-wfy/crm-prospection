# WebFitYou CRM - Prospection

CRM de prospection interne WebFitYou : gestion des contacts, suivi des interactions (appels, email, WhatsApp, SMS), relances automatisées, séquences email et reporting de performance commerciale.

**Production :** https://crm-prospection-webfityou.netlify.app

## Stack technique

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions)
- [Resend](https://resend.com/) pour l'envoi d'email (domaine `webfityou.org`)
- [Netlify](https://www.netlify.com/) pour l'hébergement

## Démarrage local

```bash
npm install
cp .env.example .env   # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Lint du code |
| `npm run typecheck` | Vérification TypeScript |

## Base de données

Les migrations SQL versionnées se trouvent dans `supabase/migrations/`. Toutes les tables ont la Row Level Security (RLS) activée.

## Edge Functions

| Fonction | Rôle |
| --- | --- |
| `send-email` | Envoi d'un email unique via Resend |
| `rewrite-email` | Réécriture IA d'un email (OpenRouter) pour varier le contenu des relances |
| `process-sequences` | Traitement périodique des séquences email automatisées (relances) |

Déploiement : `supabase functions deploy <nom> --project-ref <ref>`.
