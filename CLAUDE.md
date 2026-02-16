# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PotionGo is a potion delivery platform with three components in a monorepo:
- **`admin/`** — Admin dashboard (Next.js 15, TypeScript, Tailwind CSS, Firebase)
- **`admin/functions/`** — Firebase Cloud Functions (TypeScript)
- **`app/`** — Android mobile app (Kotlin, Jetpack Compose, Hilt, Firebase)

All three share a single Firebase project (Firestore, Realtime DB, Auth, Cloud Functions, FCM, Storage).

## Build & Development Commands

### Admin (Next.js)
```bash
cd admin
npm ci                          # Install dependencies
npm run dev                     # Dev server on port 3010
npm run build                   # Production build
npm run lint                    # ESLint
npm run test:static             # ESLint + Prettier check
npm run test:static:pretty:fix  # Auto-fix Prettier formatting
```

### Cloud Functions
```bash
cd admin/functions
npm ci
npm run build                   # Compile TypeScript
npm run serve                   # Build + start Firebase emulator
npm run deploy                  # Deploy to Firebase
```

### Android App
```bash
cd app
./gradlew build                 # Full build
./gradlew assembleDebug         # Debug APK
./gradlew test                  # Unit tests
./gradlew connectedAndroidTest  # Instrumentation tests
```

### CI
- **Admin CI** (`.github/workflows/admin.yml`): `npm ci` → `npm run test:static` → `npm run build`
- **Android CI** (`.github/workflows/app.yml`): `./gradlew build` (JDK 17)

## Architecture

### Admin — Next.js App Router

Uses the App Router pattern with route groups under `src/app/`:

- **`00_INFRA/`** — Shared infrastructure: `AuthContext`, `ThemeContext`, repository interfaces/implementations, type definitions
- **`api/`** — Server-side API routes: `auth/session`, `orders`, `products`, `ratings`, `users`, `dashboard/stats`
- **`dashboard/`** — Protected pages: orders, products, users (list + detail views)

**Key patterns:**
- **Repository pattern** with interfaces (`*Repository.interface.ts`) and implementations — all under `00_INFRA/Repositories/`
- **CSRF protection**: API utils generate/validate CSRF tokens; client repos include them via `withCsrfHeaders()`
- **Session auth**: Firebase ID token → HttpOnly session cookie (12h TTL); `requireAdmin()` guard on all API routes
- **Zod validation**: Each API resource has a `schema.ts` for input validation
- **Path alias**: `@/*` maps to `./src/*`

**Firebase config resolution** (`config/firebase-admin.js`): env var `FIREBASE_SERVICE_ACCOUNT_JSON` → file `client_service_account.json` → individual env vars → application default credentials.

### Cloud Functions

Located in `admin/functions/src/`. Four callable functions:
- `createUser` — Sets role in custom claims during signup
- `createOrder` — Creates order, generates 6-digit validation code, finds nearby drivers (Haversine, 10km radius), sends FCM notifications
- `acceptOrder` — Driver accepts a pending order
- `validateOrder` — Customer confirms delivery with validation code

All use Zod validation and `HttpsError` for error responses.

### Android App — Clean Architecture + MVVM

Package: `com.example.potiongo` under `app/app/src/main/java/`

**Layers:**
- **`data/`** — Data classes: `Cart`, `Order`, `OrderItem`, `Product`, `User`, `Role`
- **`domain/`** — Use cases (one per business action): `PlaceOrderUseCase`, `LoginUseCase`, `AcceptOrderUseCase`, etc.
- **`repository/`** — Data access with Hilt DI modules: `CartRepository` (in-memory StateFlow), `OrderRepository`, `ProductRepository`, `UserRepository`
- **`services/`** — Firebase wrappers: `AuthService`, `CloudFunctionsService`, `GoogleAuthService`, `PotionGoMessagingService` (FCM)
- **`ui/screens/`** — Each screen has `Screen.kt` (Composable), `ViewModel.kt` (`@HiltViewModel`), `UiState.kt` (sealed class)
- **`ui/component/`** — Reusable composables: `BottomBar`, `PotionGoScaffold`, `ProductCard`, `ProductGrid`
- **`ui/navigation/`** — `AppNavGraph` with `AppScreenDestination` enum for type-safe routes
- **`ui/theme/`** — Material 3 theme: `Color.kt`, `Theme.kt`, `Type.kt`

**DI**: Hilt with `@HiltAndroidApp` on `App.kt`, `@InstallIn(SingletonComponent)` modules in repository/service files.

**State**: `MutableStateFlow<UiState>` → `.asStateFlow()` → `collectAsState()` in composables. UiState sealed classes have variants like `Ready`, `Loading`, `Success`, `Error`.

**Navigation**: Role-based — customers see product catalog + cart, drivers see order requests + active deliveries.

### Data Model

**Order statuses**: `PENDING` → `ASSIGNED` → `IN_TRANSIT` → `DELIVERED` | `CANCELLED`

**User roles**: `customer` (place orders), `driver` (accept/deliver orders), `admin` (dashboard access)

**Driver location**: Tracked via Firebase Realtime DB at `/drivers/{driverId}/location`, writable only by the driver.

## Code Style

- **Admin**: Prettier (no semicolons, double quotes, 100 char width), ESLint with `next/core-web-vitals` + `next/typescript`
- **Android**: Kotlin with Jetpack Compose, JVM target 11, compileSdk 36, minSdk 24

## Environment Setup

Admin requires a `.env.local` file (see `.env.template`) with Firebase credentials. The Android app uses `google-services.json` at `app/app/`.
