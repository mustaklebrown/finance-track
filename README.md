# Finance & Multi-Store Management System

Une application moderne de gestion financière, d'inventaire et d'analyse marketing conçue pour les commerçants et les gestionnaires de points de vente. Optimisée pour la productivité et la clarté des données.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

## 🚀 Fonctionnalités Clés

### 📦 Gestion d'Inventaire & Ventes
- **Suivi en temps réel** : Les niveaux de stock sont automatiquement déduits lors de chaque vente.
- **Facturation instantanée** : Génération de tickets de caisse formatés avec calcul automatique du montant à rendre.
- **Partage Social** : Envoyez vos factures directement à vos clients via **WhatsApp**, **Telegram** ou partage natif (Instagram/SMS).
- **Historique complet** : Journalisation détaillée de chaque transaction et mouvement de stock.

### 📊 Analyses & KPIs Financiers
- **Tableau de bord dynamique** : Vue d'ensemble du chiffre d'affaires, des dépenses et de la marge nette.
- **Soldes Intermédiaires de Gestion (SIG)** : Calculs comptables automatisés pour suivre la santé de l'entreprise.
- **Analyse par Cohorte** : Suivi de la fidélisation client et du cycle de vie des produits.
- **Visualisations** : Graphiques interactifs pour les tendances de ventes et la répartition par catégorie.

### 📣 Marketing & CRM
- **ROI Marketing** : Liez vos campagnes publicitaires (Facebook, Ads, etc.) à vos ventes de produits pour mesurer le retour sur investissement exact.
- **Gestion Clients** : Suivi des sources d'acquisition et historique d'achat par client.

### 🔐 Multi-Tenancy & Sécurité
- **Multi-Boutiques** : Structure conçue pour gérer plusieurs magasins de manière isolée.
- **Auth de Pointe** : Système d'authentification robuste avec gestion des rôles (Propriétaire, Manager, Staff).

## 🛠️ Stack Technique

- **Frontend** : React 19, Next.js 15 (App Router).
- **Styling** : CSS moderne avec animations fluides et support complet du mode sombre.
- **Backend** : API Routes Next.js.
- **Base de données** : PostgreSQL (Neon) via Prisma ORM.
- **Icônes** : Lucide React.
- **Validations** : Zod.

## 🏁 Installation & Démarrage

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/votre-username/votre-repo.git
   cd finance
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Variables d'environnement** :
   Créez un fichier `.env` à la racine et ajoutez votre URL de base de données :
   ```env
   DATABASE_URL="postgres://..."
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Initialiser la base de données** :
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Lancer le mode développement** :
   ```bash
   npm run dev
   ```

## 📄 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

---
*Conçu avec ❤️ pour simplifier la gestion de votre business.*
