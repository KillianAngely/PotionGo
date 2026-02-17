# PotionGo Admin - Documentation technique

## Vue d'ensemble

Dashboard d'administration pour la plateforme PotionGo. Application Next.js 15 avec App Router, TypeScript, Tailwind CSS et Firebase.

**Stack technique :**

| Categorie    | Technologie                         |
| ------------ | ----------------------------------- |
| Framework    | Next.js 15 (App Router) + React 19  |
| Langage      | TypeScript (strict mode)            |
| Styling      | Tailwind CSS 4 + CSS Modules        |
| Validation   | Zod 4 + react-hook-form 7           |
| Auth         | Firebase Auth (session cookies 12h) |
| Database     | Firebase Firestore + Realtime DB    |
| Storage      | Firebase Storage                    |
| Code Quality | ESLint + Prettier                   |

---

## Structure du projet

```
admin/
├── config/
│   └── firebase-admin.js            # Init Firebase Admin SDK
├── src/
│   ├── middleware.ts                 # Headers de securite (CSP, etc.)
│   └── app/
│       ├── layout.tsx                # Layout racine (providers Auth + Theme)
│       ├── page.tsx                  # Page de connexion
│       ├── globals.css               # Styles globaux + variables CSS
│       ├── 00_INFRA/                 # Infrastructure partagee
│       │   ├── Components/
│       │   │   ├── AdminShell.tsx    # Layout principal (sidebar + contenu)
│       │   │   └── ThemeToggle.tsx   # Bouton theme clair/sombre
│       │   ├── Context/
│       │   │   ├── AuthContext.tsx   # Contexte authentification
│       │   │   └── ThemeContext.tsx  # Contexte theme
│       │   ├── Repositories/
│       │   │   ├── Dashboard/       # Stats du dashboard
│       │   │   ├── Order/           # CRUD commandes
│       │   │   ├── Product/         # CRUD produits
│       │   │   ├── Rating/          # CRUD evaluations
│       │   │   └── User/            # CRUD utilisateurs
│       │   └── types/
│       │       ├── Order.ts         # Types commandes + enum OrderStatus
│       │       ├── Product.ts       # Types produits
│       │       ├── Rating.ts        # Types evaluations
│       │       └── User.ts          # Types utilisateurs + enum UserRole
│       ├── api/                     # Routes API serveur
│       │   ├── _utils/
│       │   │   ├── api.ts           # requireAdmin(), reponses JSON
│       │   │   └── csrf.ts          # Generation/validation CSRF
│       │   ├── auth/session/route.ts
│       │   ├── health/route.ts
│       │   ├── dashboard/stats/route.ts
│       │   ├── orders/
│       │   │   ├── route.ts         # GET list, POST create
│       │   │   ├── schema.ts        # Validation Zod
│       │   │   └── [id]/route.ts    # GET detail, DELETE
│       │   ├── products/
│       │   │   ├── route.ts
│       │   │   ├── schema.ts
│       │   │   └── [id]/route.ts
│       │   ├── users/
│       │   │   ├── route.ts
│       │   │   ├── schema.ts
│       │   │   ├── [id]/route.ts
│       │   │   ├── [id]/ratings/route.ts
│       │   │   └── export/route.ts  # Export CSV
│       │   └── ratings/
│       │       ├── route.ts
│       │       ├── schema.ts
│       │       └── [id]/route.ts
│       └── dashboard/               # Pages protegees
│           ├── layout.tsx            # Guard admin (AdminShell)
│           ├── page.tsx              # Accueil dashboard + stats
│           ├── orders/
│           │   ├── page.tsx          # Liste commandes
│           │   └── [id]/page.tsx     # Detail commande
│           ├── products/
│           │   ├── page.tsx          # Liste produits + creation
│           │   └── [id]/page.tsx     # Detail produit
│           └── users/
│               ├── page.tsx          # Liste utilisateurs + creation + export
│               └── [id]/page.tsx     # Detail utilisateur + evaluations
├── functions/                        # Cloud Functions Firebase
│   ├── src/
│   │   ├── index.ts                  # Exports des fonctions
│   │   ├── createUser.ts
│   │   ├── createOrder.ts
│   │   ├── acceptOrder.ts
│   │   ├── validateOrder.ts
│   │   ├── updateUser.ts
│   │   └── submitRating.ts
│   ├── package.json
│   └── tsconfig.json
├── firebase.json                     # Configuration Firebase
├── firestore.rules                   # Regles de securite Firestore
├── database.rules.json               # Regles Realtime DB
├── storage.rules                     # Regles Storage
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

## Authentification et securite

### Flux de connexion

1. L'admin entre email/mot de passe sur `/`
2. `signInWithEmailAndPassword()` Firebase cote client
3. Verification du custom claim `role === "admin"`
4. POST de l'ID token vers `/api/auth/session`
5. Creation d'un session cookie HttpOnly (TTL 12h) + token CSRF
6. Redirection vers `/dashboard`

### Protection CSRF

- **Generation** : `crypto.randomBytes(32)` → token hex 64 caracteres
- **Stockage client** : Cookie `csrfToken` (accessible JS)
- **Envoi** : Header `x-csrf-token` via `withCsrfHeaders()`
- **Validation serveur** : Cookie == Header, sinon 403 + invalidation session
- **Requis sur** : Toutes les mutations (POST, PUT, DELETE)

### Middleware (`src/middleware.ts`)

Applique sur toutes les routes (sauf API/static) les headers :

| Header                       | Valeur                                               |
| ---------------------------- | ---------------------------------------------------- |
| Content-Security-Policy      | self + Firebase APIs                                 |
| Referrer-Policy              | strict-origin-when-cross-origin                      |
| X-Content-Type-Options       | nosniff                                              |
| X-Frame-Options              | DENY                                                 |
| Cross-Origin-Opener-Policy   | same-origin                                          |
| Cross-Origin-Resource-Policy | same-origin                                          |
| Permissions-Policy           | camera=(), microphone=(), geolocation=(), payment=() |

---

## Routes API

### Authentication

| Methode | Route               | Description                                            |
| ------- | ------------------- | ------------------------------------------------------ |
| POST    | `/api/auth/session` | Cree la session (cookie + CSRF) a partir d'un ID token |
| DELETE  | `/api/auth/session` | Deconnexion (supprime cookies, revoque tokens)         |
| GET     | `/api/health`       | Health check                                           |

### Dashboard

| Methode | Route                  | Description                                                 |
| ------- | ---------------------- | ----------------------------------------------------------- |
| GET     | `/api/dashboard/stats` | Statistiques agregees (totaux, roles, statuts, evaluations) |

### Commandes

| Methode | Route              | Description                                                           |
| ------- | ------------------ | --------------------------------------------------------------------- |
| GET     | `/api/orders`      | Liste paginee avec filtres (status, search, prix) et tri multi-champs |
| POST    | `/api/orders`      | Creer une commande (CSRF requis)                                      |
| GET     | `/api/orders/[id]` | Detail d'une commande                                                 |
| DELETE  | `/api/orders/[id]` | Supprimer une commande (CSRF requis)                                  |

**Parametres GET `/api/orders` :**

- `page`, `pageSize` (max 100)
- `status` : PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED, all
- `search` : recherche sur ID, nom client/livreur, adresse
- `minTotal`, `maxTotal` : filtre par prix
- `sort` : format `field:asc,field2:desc`

### Produits

| Methode | Route                | Description                                     |
| ------- | -------------------- | ----------------------------------------------- |
| GET     | `/api/products`      | Liste paginee avec filtres (search, mood, prix) |
| POST    | `/api/products`      | Creer un produit (CSRF requis)                  |
| GET     | `/api/products/[id]` | Detail d'un produit                             |
| DELETE  | `/api/products/[id]` | Supprimer un produit (CSRF requis)              |

### Utilisateurs

| Methode | Route                     | Description                                                          |
| ------- | ------------------------- | -------------------------------------------------------------------- |
| GET     | `/api/users`              | Liste paginee avec filtres (role, search)                            |
| POST    | `/api/users`              | Creer un utilisateur (CSRF requis, roles CUSTOMER/DRIVER uniquement) |
| GET     | `/api/users/[id]`         | Detail utilisateur                                                   |
| DELETE  | `/api/users/[id]`         | Supprimer utilisateur (Auth + Firestore)                             |
| GET     | `/api/users/export`       | Export CSV de tous les utilisateurs                                  |
| GET     | `/api/users/[id]/ratings` | Evaluations et stats d'un utilisateur                                |

---

## Schemas de validation Zod

### Product (`products/schema.ts`)

```typescript
{
  name: string (1-100 chars, pas de HTML),
  price: number (positif),
  mood: string (pas de HTML),
  description?: string (max 500, pas de HTML),
  imageUrl?: string
}
```

### Order (`orders/schema.ts`)

```typescript
{
  customerId: string,
  driverId: string | null,
  status: "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED",
  items: [{ potionId, quantity }] (min 1),
  dropoff: { address (pas de HTML), lat, lng },
  driverStart?: { address?, lat, lng } | null,
  validationCode?: string (6 chars),
  createdAt?: number | Date
}
```

### User (`users/schema.ts`)

```typescript
{
  email: string (email valide),
  firstName: string (2+ chars, pas de HTML),
  lastName: string (2+ chars, pas de HTML),
  password: string (6+ chars),
  role: "CUSTOMER" | "DRIVER"  // ADMIN interdit via API
}
```

---

## Pattern Repository

Chaque entite suit le pattern interface + implementation :

```
00_INFRA/Repositories/{Entity}/
├── {Entity}Repository.interface.ts   # Interface avec types Input/Output
└── {Entity}Repository.ts             # Implementation (appels fetch vers /api)
```

### Repositories disponibles

| Repository            | Methodes                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `DashboardRepository` | `getStats()`                                                                                                       |
| `OrderRepository`     | `list(query)`, `findAll()`, `findById(id)`, `create(payload)`, `removeById(id)`                                    |
| `ProductRepository`   | `list(query)`, `findAll()`, `findById(id)`, `create(payload)`, `removeById(id)`                                    |
| `UserRepository`      | `list(query)`, `findAll()`, `findAllByRole(role)`, `findById(id)`, `create(payload)`, `removeById(id)`, `export()` |
| `RatingRepository`    | `list(query)`, `findAll()`, `findById(id)`, `findByUserId(id)`, `create(payload)`, `removeById(id)`                |

Toutes les mutations incluent automatiquement les headers CSRF via `withCsrfHeaders()`.

---

## Types TypeScript

### UserRole

```typescript
enum UserAdminRole {
  ADMIN = "ADMIN",
}
enum UserClientRole {
  CUSTOMER = "CUSTOMER",
  DRIVER = "DRIVER",
}
type UserRole = UserAdminRole | UserClientRole
```

### OrderStatus

```typescript
enum OrderStatus {
  PENDING,
  ASSIGNED,
  IN_TRANSIT,
  DELIVERED,
  CANCELLED,
}
```

### Interfaces principales

- `User` : uid, email, firstName, lastName, role
- `Product` : id, name, price, mood, description?, imageUrl?
- `Order` : id, customerId, driverId, status, items[], dropoff, validationCode, createdAt
- `Rating` : id, orderId, reviewerId, reviewerRole, revieweeId, revieweeRole, rating, comment?

---

## Pages du dashboard

### `/` - Connexion

- Formulaire email/mot de passe avec validation Zod
- Erreur si l'utilisateur n'est pas admin

### `/dashboard` - Accueil

- Boutons d'acces rapide (Utilisateurs, Commandes, Produits)
- Totaux : utilisateurs, produits, commandes, evaluations, unites vendues
- Distribution par role (graphique en barres)
- Distribution par statut de commande
- Statistiques des evaluations (moyenne, distribution)

### `/dashboard/orders` - Commandes

- Tableau pagine (5, 10, 20, 50 par page)
- Filtre par statut
- Recherche full-text
- Tri multi-champs (primaire + secondaire, asc/desc)
- Suppression avec confirmation modale

### `/dashboard/products` - Produits

- Liste paginee avec recherche, filtre par mood, filtre prix min/max
- Modal de creation (nom, mood, prix, description, upload image)
- Badges de couleur par mood (SAD, HAPPY, ANGRY)

### `/dashboard/users` - Utilisateurs

- Liste paginee avec filtre par role, recherche
- Modal de creation (prenom, nom, email, mot de passe, role)
- Export CSV
- Badges de role colores

### `/dashboard/users/[id]` - Detail utilisateur

- Metadonnees (uid, email, nom, role)
- Section evaluations : moyenne, distribution, 5 derniers commentaires
- Section commandes/livraisons (tableau pagine)

---

## Cloud Functions

### `createUser`

- **Input** : `{ role: "driver"|"customer", email, firstName, lastName }`
- **Actions** : Set custom claims + cree document Firestore
- **Rollback** : Supprime l'utilisateur Auth si Firestore echoue

### `createOrder`

- **Input** : `{ items: [{potionId, quantity}], dropoff: {address, lat, lng} }`
- **Actions** : Genere code 6 chiffres, cree commande PENDING, cherche livreurs < 10km (Haversine), envoie FCM
- **Retour** : `{ orderId, validationCode }`

### `acceptOrder`

- **Input** : `{ orderId }`
- **Actions** : Transaction Firestore → verifie PENDING → ASSIGNED + driverStart

### `validateOrder`

- **Input** : `{ orderId, validationCode (6 chars) }`
- **Actions** : Verifie le code → DELIVERED

### `submitRating`

- **Input** : `{ orderId, rating: 1-5, comment? }`
- **Actions** : Cree l'evaluation, recalcule la moyenne du note, empeche les doublons

### `updateUser`

- **Input** : `{ firstName, lastName, email? }`
- **Actions** : Met a jour Firestore + Auth si email change

---

## Theme et styling

### Tailwind CSS

- Theme avec variables CSS personnalisees (bg, fg, card, muted, accent, accent2, accent3)
- Mode sombre via classe `.dark` sur `<html>`
- Persistence du theme dans localStorage

### Couleurs

- **Accent** : Bleu primaire
- **Accent2** : Cyan/Teal secondaire
- **Accent3** : Violet tertiaire
- **Statuts** : Vert (DELIVERED), Rouge (CANCELLED), Jaune (evaluations)

---

## Configuration Firebase Admin

Resolution des credentials (`config/firebase-admin.js`) :

1. Variable d'env `CLIENT_SERVICE_ACCOUNT_JSON` (JSON string)
2. Application Default Credentials (GCP)

---

## Dependances principales

| Package               | Version  | Usage                  |
| --------------------- | -------- | ---------------------- |
| `next`                | ^15.5.12 | Framework web          |
| `react` / `react-dom` | 19.1.0   | UI                     |
| `firebase`            | ^12.4.0  | SDK client Firebase    |
| `firebase-admin`      | ^13.6.0  | SDK serveur Firebase   |
| `zod`                 | ^4.3.5   | Validation de schemas  |
| `react-hook-form`     | ^7.71.1  | Gestion de formulaires |
| `@hookform/resolvers` | ^5.2.2   | Resolver Zod pour RHF  |
| `tailwindcss`         | ^4.1.18  | CSS utilitaire         |
| `typescript`          | ^5       | Typage statique        |
| `eslint`              | ^9       | Linting                |
| `prettier`            | ^3.6.2   | Formatage              |
