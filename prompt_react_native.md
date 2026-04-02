# Prompt de Génération de l'Application Mobile React Native

**Contexte pour l'IA :**
Tu es un développeur expert en React Native, TypeScript et UX/UI Mobile. Ton objectif est de développer l'application mobile (compagnon SaaS) de notre système de gestion financière, de vente et de marketing existant. Le back-end est déjà construit avec Next.js, Prisma et PostgreSQL.

Voici le cahier des charges détaillé pour générer le code de l'application mobile.

---

## 1. Stack Technique Souhaitée
- **Framework :** React Native avec Expo (pour faciliter le développement, le build et l'accès aux modules natifs).
- **Langage :** TypeScript strict.
- **Routage / Navigation :** React Navigation V6 (ou Expo Router). Architecture avec Bottom Tabs (Dashboard, Ventes, Produits, Paramètres) et Stack Navigation pour les écrans détaillés.
- **Styling :** NativeWind (Tailwind pour React Native) pour avoir la même approche utilitaire que le projet web.
- **Gestion d'État & Data Fetching :** TanStack React Query (pour interagir avec l'API REST Next.js) et Zustand (pour l'état global si nécessaire, comme le panier de vente).
- **Stockage Local :** `expo-secure-store` pour stocker le token d'authentification de manière sécurisée.
- **Fonctionnalités Natives :** 
  - `expo-print` pour la génération des factures/tickets au format PDF.
  - `expo-sharing` pour le partage natif (WhatsApp, Telegram) du ticket généré.
  - `expo-camera` pour scanner des codes-barres de produits (futur, mais à anticiper).

## 2. Architecture de l'Application (Screens & Flux)

### A. Auth Flow (Stack)
1. **Écran de Connexion :** Email/Mot de passe. L'application doit s'interfacer avec le back-end existant (BetterAuth) et récupérer un token de session.

### B. Main App (Bottom Tabs)
1. **Tab "Dashboard" (Tableau de Bord) :**
   - Affichage des KPIs globaux (Chiffre d'affaires du mois, Marge nette, ROI Marketing).
   - Graphiques de ventes ou d'évolution du SIG (Soldes Intermédiaires de Gestion).
   - Alertes de stock faible.
2. **Tab "Caisse" (Ventes au quotidien) :**
   - Écran de Point de Vente (POS) optimisé pour mobile.
   - Barre de recherche de produits rapide.
   - Ajout au "panier" avec gestion des quantités (boutons +/-) et modification du prix unitaire.
   - Saisie du "Montant Donné" et calcul automatique du "Rendu Monnaie".
   - **Post-Vente :** Dès validation, l'application génère un ticket de caisse en mémoire, l'affiche, et propose des boutons "Envoyer PDF", "WhatsApp", "Telegram" en utilisant le partage natif de l'OS.
3. **Tab "Inventaire" (Produits) :**
   - Liste de tous les produits (nom, stock, prix d'achat, prix de vente).
   - Possibilité de filtrer par catégorie.
   - Écran de détail d'un produit (historique des mouvements de stock).
4. **Tab "Menu" / "Plus" :**
   - Campagnes Marketing (suivi du budget et des ventes générées).
   - Gestion des clients.
   - Déconnexion et paramètres.

## 3. UI/UX Guidelines (Design System)
- **Thème :** Reprendre l'approche esthétique de l'appli Web (Glassmorphism, animations fluides, minimaliste). 
- L'interface doit supporter le **Dark Mode** et le **Light Mode** nativement.
- **Couleurs Principales :** Zinc/Slate structuré (Zin-900 pour le texte dark, Zinc-50 pour les fonds clairs) avec des accents couleur Émeraude (Emerald-600) pour les actions positives (ventes, revenus, validations) et Rose/Red (Rose-500) pour les suppressions/alertes.
- Utiliser des composants tactiles généreux (minimum 44x44 points) pour une manipulation facile "à un pouce" sur l'écran Caisse.

## 4. Modèle de Données (Prisma contextuel)
Voici un extrait des entités principales du Back-End pour bien concevoir les interfaces et les types TypeScript :

```prisma
model User {
  id            String    @id
  email         String    
  name          String
  role          String    // OWNER, MANAGER, STAFF
  storeId       String    // Multi-tenant
}

model Product {
  id            String    @id
  name          String
  purchasePrice Float     // COGS
  sellingPrice  Float
  stockLevel    Int       
  categoryId    String?   
}

model Sale {
  id             String     @id
  totalAmount    Float
  amountGiven    Float?   // Montant donné par le client
  changeReturned Float?   // Monnaie rendue
  createdAt      DateTime 
  items          SaleItem[]
}

model SaleItem {
  id        String    @id
  quantity  Int
  unitPrice Float     
  unitCost  Float     
  productId String
}
```

## 5. Plan d'Action (Comment tu dois procéder)
1. **Initialisation :** Propose d'abord le script de création de projet (via Expo CLI).
2. **Setup d'architecture :** Propose la structure des dossiers (ex: `/src/screens`, `/src/components`, `/src/api`, `/src/store`).
3. **Composants Core :** Implémente le système de Tab Navigation et les types TypeScript basés sur Prisma.
4. **Écran POS (Caisse) & Facture :** C'est le cœur de l'app. Fournis le code complet pour la logique d'ajout au panier, la validation de la vente via fetch/axios, et la génération du reçu PDF via `expo-print`.
5. **Polissage :** Ajoute des animations de transition fluides (React Native Reanimated) pour valider qu'on a bien un ressenti Premium.

Génère le code étape par étape en t'assurant d'appliquer les meilleures pratiques de performances (FlatList optimisées, mémorisation).
