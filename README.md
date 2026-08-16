# TDSSNEAKERS

Boutique e-commerce moderne pour sneakers et vêtements streetwear, construite avec Next.js et Tailwind CSS. Destination n°1 pour les sneakers et vêtements sport & casual au Canada.

## Fonctionnalités

### Storefront
- **Header sticky** avec navigation, barre d'annonce et compteur de panier
- **Page d'accueil** : hero, badges de confiance, nouveautés, bannières catégories, best sellers
- **Boutique** : grille produits 3 colonnes avec sidebar de filtres (catégorie, taille, couleur, prix)
- **Panier slide-over** avec gestion des quantités et total
- **Cartes produits** avec états au survol et ajout rapide au panier
- Design entièrement responsive

### Portail Admin (`/admin`)
- **Tableau de bord** avec KPIs et aperçu des commandes
- **Gestion des produits** : ajout, modification et suppression (CRUD complet)
- **Gestion des commandes** avec filtres par statut et mise à jour
- **Clients** dérivés des commandes
- **Paramètres** de la boutique

Les produits sont partagés via un contexte React et persistés dans le `localStorage`, donc les modifications de l'admin se reflètent immédiatement sur le storefront.

## Prêt pour la production
- Métadonnées SEO complètes (Open Graph, Twitter cards)
- `robots.txt` et `sitemap.xml` générés
- Manifest PWA
- En-têtes de sécurité (HSTS, X-Frame-Options, etc.)
- États de chargement, error boundary et page 404 personnalisée
- Optimisation des images (AVIF / WebP)

## Stack technique
- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- TypeScript
- [Saleor](https://saleor.io/) — backend e-commerce headless (API GraphQL), optionnel

## Intégration Saleor

Le storefront peut consommer les produits depuis l'API GraphQL de [Saleor](https://github.com/saleor/saleor), une plateforme e-commerce headless. L'intégration est **non-destructive** : si Saleor n'est pas configuré ou injoignable, le projet revient automatiquement au catalogue statique intégré.

### Configuration

Copiez `.env.example` vers `.env.local` et ajustez :

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SALEOR_API_URL` | Endpoint GraphQL Saleor (ex: `https://votre-store.saleor.cloud/graphql/`) |
| `NEXT_PUBLIC_SALEOR_CHANNEL` | Slug du canal Saleor (ex: `default-channel`) |
| `NEXT_PUBLIC_USE_SALEOR` | `true` pour activer Saleor, `false` pour le catalogue statique |

### Obtenir un backend Saleor

- **Saleor Cloud** (recommandé) : créez une instance gratuite avec données de démo sur [cloud.saleor.io](https://cloud.saleor.io/)
- **Auto-hébergé** : lancez Saleor via Docker (voir le [dépôt Saleor](https://github.com/saleor/saleor)), endpoint par défaut `http://localhost:8000/graphql/`
- **Test rapide** : l'endpoint public de staging `https://master.staging.saleor.cloud/graphql/` est configuré par défaut

### Comment ça marche

- `src/lib/saleor/` : client GraphQL (fetch), requêtes et service de mapping
- Les produits Saleor sont mappés vers l'interface `Product` de l'app (prix, image, tailles, couleur dérivés des attributs/variantes Saleor)
- `ProductContext` tente Saleor en premier, puis retombe sur le catalogue local
- Le tableau de bord admin affiche la source active (SALEOR / STATIC)

> Note : les mutations d'écriture (ajout/modification via l'admin) restent locales à la session. Écrire dans Saleor nécessite des jetons d'application avec permissions staff, hors périmètre de cette intégration de démonstration.

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
│   ├── (storefront)/     # Pages publiques (accueil, boutique)
│   ├── (admin)/admin/    # Portail admin (dashboard, produits, commandes...)
│   ├── layout.tsx        # Layout racine + providers
│   ├── robots.ts         # robots.txt
│   ├── sitemap.ts        # sitemap.xml
│   └── manifest.ts       # manifest PWA
├── components/           # Composants réutilisables
├── context/              # Contextes React (panier, produits)
└── data/                 # Données produits et commandes
```
