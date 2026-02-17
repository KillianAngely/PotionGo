# PotionGo - Documentation Projet

## Vue d'ensemble

PotionGo est une plateforme de livraison de potions composee de trois composants dans un monorepo :

| Composant | Technologie | Description |
|-----------|------------|-------------|
| `admin/` | Next.js 15, TypeScript, Tailwind CSS | Dashboard d'administration |
| `admin/functions/` | Firebase Cloud Functions, TypeScript | Logique metier cote serveur |
| `app/` | Kotlin, Jetpack Compose, Hilt | Application mobile Android |

Les trois partagent un seul projet Firebase (`potiongo-f85b7`) utilisant : Firestore, Realtime Database, Authentication, Cloud Functions, FCM, et Storage.

---

## Architecture globale

```
PotionGo/
├── .github/
│   └── workflows/
│       ├── admin.yml          # CI admin (lint + build)
│       ├── admin.pr.yml       # CI admin PR
│       ├── app.yml            # CI Android (build + APK)
│       └── app.pr.yml         # CI Android PR
├── admin/                     # Dashboard Next.js
│   ├── config/                # Configuration Firebase Admin
│   ├── src/                   # Code source Next.js
│   ├── functions/             # Cloud Functions
│   ├── firebase.json          # Config Firebase
│   ├── firestore.rules        # Regles Firestore
│   ├── firestore.indexes.json # Index Firestore
│   ├── database.rules.json    # Regles Realtime DB
│   └── storage.rules          # Regles Storage
├── app/                       # Application Android
│   ├── app/                   # Module principal
│   ├── build.gradle.kts       # Config Gradle racine
│   └── settings.gradle.kts    # Settings Gradle
├── CLAUDE.md                  # Instructions pour Claude Code
├── PROJECT.md                 # Ce fichier
└── README.md                  # README du projet
```

---

## Modele de donnees

### Collections Firestore

#### `users/{userId}`
| Champ | Type | Description |
|-------|------|-------------|
| `email` | string | Adresse email |
| `firstName` | string | Prenom |
| `lastName` | string | Nom |
| `role` | string | `customer`, `driver`, ou `admin` |
| `fcmToken` | string | Token FCM pour les notifications push |
| `averageRating` | number | Note moyenne (calculee) |
| `totalRatings` | number | Nombre total d'evaluations |

#### `products/{productId}`
| Champ | Type | Description |
|-------|------|-------------|
| `name` | string | Nom de la potion |
| `price` | number | Prix unitaire |
| `mood` | string | Humeur associee (SAD, HAPPY, ANGRY...) |
| `description` | string? | Description optionnelle |
| `imageUrl` | string? | URL de l'image (Firebase Storage) |

#### `orders/{orderId}`
| Champ | Type | Description |
|-------|------|-------------|
| `customerId` | string | UID du client |
| `driverId` | string? | UID du livreur |
| `status` | string | Statut de la commande |
| `items` | array | Liste `{ potionId, quantity }` |
| `dropoff` | object | `{ address, lat, lng }` |
| `driverStart` | object? | `{ lat, lng }` position du livreur |
| `validationCode` | string | Code a 6 chiffres pour validation |
| `createdAt` | timestamp | Date de creation |

#### `ratings/{ratingId}`
| Champ | Type | Description |
|-------|------|-------------|
| `orderId` | string | ID de la commande |
| `reviewerId` | string | UID de l'evaluateur |
| `reviewerRole` | string | `CUSTOMER` ou `DRIVER` |
| `revieweeId` | string | UID de l'evalue |
| `revieweeRole` | string | `CUSTOMER` ou `DRIVER` |
| `rating` | number | Note de 1 a 5 |
| `comment` | string? | Commentaire optionnel |
| `createdAt` | timestamp | Date de creation |

### Realtime Database

```
drivers/
  {driverId}/
    location/
      lat: number
      lng: number
      timestamp: number
```
Regles : lecture pour tout utilisateur authentifie, ecriture uniquement par le livreur concerne.

### Cycle de vie d'une commande

```
PENDING → ASSIGNED → IN_TRANSIT → DELIVERED
                                → CANCELLED
```

1. **PENDING** : Le client passe commande via `createOrder`. Code de validation genere. Notification FCM envoyee aux livreurs proches (rayon 10 km, localisation < 5 min).
2. **ASSIGNED** : Un livreur accepte via `acceptOrder` (transaction Firestore). Sa position de depart est enregistree.
3. **IN_TRANSIT** : Le livreur est en route (mise a jour cote app).
4. **DELIVERED** : Le livreur valide la livraison via `validateOrder` avec le code a 6 chiffres.

### Roles utilisateur

| Role | Droits |
|------|--------|
| `customer` | Parcourir les produits, passer des commandes, suivre les livraisons, noter les livreurs |
| `driver` | Voir les commandes en attente, accepter/livrer, valider la livraison, noter les clients |
| `admin` | Acces au dashboard : CRUD complet sur users/orders/products/ratings, statistiques |

---

## Cloud Functions

Six fonctions callable deployees depuis `admin/functions/src/` :

| Fonction | Role requis | Description |
|----------|-------------|-------------|
| `createUser` | Authentifie | Definit le role via custom claims + cree le document Firestore |
| `createOrder` | Customer | Cree une commande, genere le code de validation, notifie les livreurs proches |
| `acceptOrder` | Driver | Accepte une commande PENDING (transaction), enregistre la position du livreur |
| `validateOrder` | Driver | Valide la livraison avec le code a 6 chiffres, passe en DELIVERED |
| `updateUser` | Authentifie | Met a jour le profil (nom, email), re-verifie l'email si change |
| `submitRating` | Authentifie | Soumet une evaluation, recalcule la moyenne du note |

Toutes utilisent la validation Zod et retournent `HttpsError` en cas d'erreur.

---

## Regles de securite Firebase

### Firestore (`firestore.rules`)
- **products** : Lecture pour tout utilisateur authentifie, ecriture interdite
- **users** : Lecture authentifiee, mise a jour uniquement de `fcmToken` par le proprietaire
- **orders** : Lecture par le client, le livreur assigne, ou si statut PENDING
- **ratings** : Lecture par l'evaluateur ou l'evalue
- **Default** : Tout refuse

### Realtime Database (`database.rules.json`)
- `/drivers/{driverId}/location` : Lecture authentifiee, ecriture par le livreur lui-meme

### Storage (`storage.rules`)
- Tout refuse par defaut (acces via le serveur admin)

---

## CI/CD

### Admin CI (`.github/workflows/admin.yml`)
- **Declencheur** : Push sur `main`, PR modifiant `admin/**`
- **Etapes** : `npm ci` → `npm run test:static` (ESLint + Prettier) → `npm run build`

### Android CI (`.github/workflows/app.yml`)
- **Declencheur** : Push sur `main`, PR modifiant `app/**`
- **Etapes** : JDK 17, `./gradlew assembleDebug test`
- **Artefacts** : Upload APK debug sur push main, release APK sur tag

---

## Commandes de developpement

### Admin (Next.js)
```bash
cd admin
npm ci                          # Installer les dependances
npm run dev                     # Serveur dev sur le port 3010
npm run build                   # Build production
npm run lint                    # ESLint
npm run test:static             # ESLint + Prettier
npm run test:static:pretty:fix  # Auto-fix Prettier
```

### Cloud Functions
```bash
cd admin/functions
npm ci
npm run build                   # Compiler TypeScript
npm run serve                   # Build + emulateur Firebase
npm run deploy                  # Deployer sur Firebase
```

### Application Android
```bash
cd app
./gradlew build                 # Build complet
./gradlew assembleDebug         # APK debug
./gradlew test                  # Tests unitaires
./gradlew connectedAndroidTest  # Tests d'instrumentation
```

---

## Configuration requise

### Admin
Creer un fichier `admin/.env.local` :
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
CLIENT_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Android
Placer `google-services.json` dans `app/app/`.

---

## Style de code

| Composant | Standard |
|-----------|----------|
| Admin | Prettier (pas de `;`, guillemets doubles, 100 car.), ESLint `next/core-web-vitals` + `next/typescript` |
| Android | Kotlin, Jetpack Compose, JVM target 11, compileSdk 36, minSdk 24 |
