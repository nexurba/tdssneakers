# TDSSNEAKERS

Boutique e-commerce moderne pour sneakers et vêtements streetwear, construite avec Next.js et Tailwind CSS. Destination n°1 pour les sneakers et vêtements sport & casual au Canada.

## Prêt pour la production
- Métadonnées SEO complètes (Open Graph, Twitter cards)
- `robots.txt` et `sitemap.xml` générés
- Manifest PWA
- En-têtes de sécurité (HSTS, X-Frame-Options, etc.)
- États de chargement, error boundary et page 404 personnalisée
- Optimisation des images (AVIF / WebP)

## Stack technique
- [Next.js](https://nextjs.org/) (App Router, Server Actions)
- [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/) + [Neon](https://neon.tech/) Postgres (base de données)
- Authentification admin par mot de passe (cookie httpOnly signé, sans service externe)
- [Stripe](https://stripe.com/) (paiements) · [Resend](https://resend.com/) (emails transactionnels)

Déployable sur **Vercel**. Tous les services externes ont un tier gratuit.

## Architecture

```
Next.js (Vercel)
├── (storefront)  vitrine : accueil, boutique, PDP, recherche, checkout
├── (admin)/admin  back-office : dashboard, produits (CRUD), commandes, clients (CRM), paramètres
├── lib/data       couche d'accès données (Drizzle) avec fallback statique
├── lib/commerce   calcul livraison / taxes
├── lib/auth · lib/stripe · lib/email
└── api/webhooks/stripe  création de commande + décrément stock + email
```

**Dégradation gracieuse** : sans `DATABASE_URL`, l'app tourne sur un catalogue statique (mode démo). Sans `ADMIN_PASSWORD`, l'admin est en mode démo ouvert. Sans clés Stripe/Resend, ces fonctionnalités sont désactivées proprement — le build et le reste du site fonctionnent quand même.

## Configuration

Copiez `.env.example` vers `.env.local` et remplissez les valeurs :

```bash
cp .env.example .env.local
```

| Variable | Rôle | Requis pour |
|----------|------|-------------|
| `DATABASE_URL` / `DIRECT_URL` | Postgres (Neon) | Persistance, commandes, CRM |
| `ADMIN_PASSWORD` | Mot de passe admin | Accès sécurisé à `/admin` |
| `ADMIN_SESSION_SECRET` | Secret de signature du cookie (optionnel) | Renforce les sessions admin |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe | Paiements |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Resend | Emails de commande |

### Mise en route de la base de données

1. **Sur Vercel (recommandé)** : dashboard → Storage → Create Database → **Neon**. Vercel injecte `DATABASE_URL` automatiquement. En local : `vercel env pull .env.local`.
   *Alternative* : collez n'importe quelle connection string Postgres dans `DATABASE_URL`.
2. Générez et appliquez le schéma, puis peuplez les données de démo :

```bash
npm run db:generate   # génère la migration SQL (déjà incluse)
npm run db:migrate    # applique les tables
npm run db:seed       # charge les 12 produits + le code promo BIENVENUE10
```

3. **Auth admin** : définissez `ADMIN_PASSWORD` dans `.env.local` (ou les variables d'env Vercel). Tant qu'il est vide, `/admin` est ouvert en mode démo.
4. **Stripe** : `stripe listen --forward-to localhost:3000/api/webhooks/stripe` en dev, et copiez le `whsec_...` dans `STRIPE_WEBHOOK_SECRET`.

## Fonctionnalités

### Storefront
- Header sticky, hero, badges, bannières, nouveautés, best sellers
- Boutique : grille 3 colonnes + filtres (catégorie, taille, couleur, prix)
- **Page produit (PDP)** : galerie, sélection de taille, stock, produits liés, **avis clients**
- **Recherche** de produits
- Panier persistant (localStorage) + drawer slide-over
- **Checkout** : coordonnées, code promo, calcul livraison/taxes, paiement **Stripe**
- Email de confirmation via **Resend**

### Admin (`/admin`)
- Authentification par **mot de passe** (`ADMIN_PASSWORD`, cookie httpOnly signé)
- Dashboard KPIs (revenu, commandes, produits, clients)
- **Produits** : CRUD complet (images par URL) + stock
- **Commandes** : filtres par statut, détail, mise à jour de statut
- **CRM Clients** : créés automatiquement au checkout, historique, dépenses, **segmentation** (nouveau / récurrent / VIP)

### Scripts DB
| Commande | Description |
|----------|-------------|
| `npm run db:generate` | Génère les migrations SQL depuis le schéma |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:seed` | Charge les données de démo |
| `npm run db:studio` | Interface Drizzle Studio |

## Démarrage

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) pour voir le storefront, et [http://localhost:3000/admin](http://localhost:3000/admin) pour le portail admin.

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Linter |

## Structure

```
src/
├── app/
│   ├── (storefront)/     # Vitrine : accueil, boutique, produit, recherche, checkout
│   ├── (admin)/admin/    # Portail admin (dashboard, produits, commandes, clients)
│   ├── api/webhooks/     # Webhook Stripe
│   ├── robots.ts · sitemap.ts · manifest.ts
├── components/           # Composants UI réutilisables
├── context/              # CartContext (panier persistant)
├── db/                   # Schéma Drizzle, client, migrations, seed
├── lib/
│   ├── data/             # Accès données (produits, commandes, clients, promos, avis, stock)
│   ├── commerce/         # Calcul livraison / taxes
│   ├── auth/             # Auth admin (mot de passe + cookie signé)
│   ├── stripe.ts · email.ts
└── data/                 # Catalogue statique de fallback
```
