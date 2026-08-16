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
