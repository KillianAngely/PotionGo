# PotionGo App - Documentation technique

## Vue d'ensemble

Application mobile Android pour la plateforme PotionGo. Permet aux clients de commander des potions et aux livreurs de les livrer.

**Stack technique :**

| Categorie | Technologie |
|-----------|------------|
| Langage | Kotlin |
| UI | Jetpack Compose + Material 3 |
| Architecture | Clean Architecture + MVVM |
| DI | Hilt (Dagger) |
| Backend | Firebase (Auth, Firestore, Realtime DB, Cloud Functions, FCM) |
| Maps | Google Maps SDK + Maps Compose |
| Images | Coil (chargement async) |
| Min SDK | 24 (Android 7.0) |
| Target/Compile SDK | 36 |
| JVM Target | 11 |

---

## Structure du projet

```
app/
├── build.gradle.kts                      # Config Gradle racine
├── settings.gradle.kts                   # Settings (repositories, modules)
└── app/
    ├── build.gradle.kts                  # Config module app
    ├── google-services.json              # Config Firebase
    ├── proguard-rules.pro                # Regles ProGuard (defaut)
    └── src/main/
        ├── AndroidManifest.xml
        ├── res/
        │   ├── values/strings.xml        # Textes (anglais)
        │   └── values-fr/strings.xml     # Textes (francais)
        └── java/com/example/potiongo/
            ├── App.kt                    # @HiltAndroidApp
            ├── MainActivity.kt           # Point d'entree + NavGraph
            ├── data/                     # Modeles de donnees
            │   ├── Cart.kt
            │   ├── Order.kt
            │   ├── OrderItem.kt
            │   ├── Product.kt
            │   ├── Role.kt
            │   └── User.kt
            ├── domain/                   # Cas d'utilisation
            │   ├── LoginUseCase.kt
            │   ├── SignUpUseCase.kt
            │   ├── LogoutUseCase.kt
            │   ├── IsAuthenticateUseCase.kt
            │   ├── GetRoleUseCase.kt
            │   ├── GetAllProductUseCase.kt
            │   ├── GetProductByIdUseCase.kt
            │   ├── PlaceOrderUseCase.kt
            │   └── AcceptOrderUseCase.kt
            ├── repository/               # Acces aux donnees
            │   ├── CartRepository.kt
            │   ├── OrderRepository.kt
            │   ├── ProductRepository.kt
            │   └── UserRepository.kt
            ├── services/                 # Wrappers Firebase
            │   ├── AuthService.kt
            │   ├── CloudFunctionsService.kt
            │   ├── GoogleAuthService.kt
            │   └── PotionGoMessagingService.kt
            └── ui/
                ├── component/            # Composables reutilisables
                │   ├── BottomBar.kt
                │   ├── PotionGoScaffold.kt
                │   ├── ProductCard.kt
                │   └── ProductGrid.kt
                ├── navigation/
                │   ├── AppNavGraph.kt
                │   └── AppScreenDestination.kt
                ├── theme/
                │   ├── Color.kt
                │   ├── Theme.kt
                │   └── Type.kt
                └── screens/
                    ├── HomeScreen.kt / HomeViewModel.kt / HomeUiState.kt
                    ├── auth/
                    │   ├── LoginScreen.kt / LoginViewModel.kt / LoginUiState.kt
                    │   └── SignUpScreen.kt / SignUpViewModel.kt / SignUpUiState.kt
                    ├── cart/
                    │   └── CartScreen.kt / CartViewModel.kt
                    ├── checkout/
                    │   └── CheckoutScreen.kt / CheckoutViewModel.kt / CheckoutUiState.kt
                    ├── detail/
                    │   └── ProductDetailScreen.kt / ProductDetailViewModel.kt / ProductDetailUiState.kt
                    ├── driver/
                    │   └── OrderRequestScreen.kt / OrderRequestViewModel.kt / OrderRequestUiState.kt
                    ├── profile/
                    │   └── ProfileScreen.kt / ProfileViewModel.kt / ProfileUiState.kt
                    └── tracking/
                        └── OrderTrackingScreen.kt / OrderTrackingViewModel.kt / OrderTrackingUiState.kt
```

---

## Architecture

### Clean Architecture - 4 couches

```
┌─────────────────────────────────────┐
│             UI (Screens)            │  Jetpack Compose + ViewModels
│  Screen.kt  ViewModel.kt  UiState  │
├─────────────────────────────────────┤
│           Domain (Use Cases)        │  Logique metier
│         *UseCase.kt                 │
├─────────────────────────────────────┤
│         Repository                  │  Acces aux donnees
│       *Repository.kt                │
├─────────────────────────────────────┤
│           Services                  │  Firebase SDKs
│  AuthService  CloudFunctions  FCM   │
└─────────────────────────────────────┘
```

### Pattern MVVM (par ecran)

Chaque ecran est compose de 3 fichiers :
- **`Screen.kt`** : Composable `@Composable` qui observe le state
- **`ViewModel.kt`** : `@HiltViewModel` avec `MutableStateFlow<UiState>`
- **`UiState.kt`** : `sealed interface` avec variantes (Loading, Ready, Success, Error)

**Flux de donnees :**
```
ViewModel.uiState (StateFlow)
    └→ .asStateFlow()
        └→ .collectAsState() dans le Composable
```

---

## Modeles de donnees (`data/`)

### Product
```kotlin
data class Product(
    val id: String,
    val name: String,
    val price: Double,
    val mood: String,
    val description: String?,
    val imageUrl: String?
)
```

### Order
```kotlin
data class Order(
    val id: String,
    val customerId: String,
    val driverId: String?,
    val status: String,          // PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED
    val items: List<OrderItem>,
    val dropoff: Map<String, Any>,
    val driverStart: Map<String, Any>?,
    val validationCode: String?,
    val createdAt: Any?
)
```

### OrderItem
```kotlin
data class OrderItem(
    val potionId: String,
    val quantity: Int
)
```

### Cart
```kotlin
data class Cart(
    val product: Product,
    val quantity: Int
)
```

### User
```kotlin
data class User(
    val uid: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String
)
```

### Role
```kotlin
enum class Role {
    CUSTOMER,
    DRIVER
}
```

---

## Cas d'utilisation (Domain)

Chaque use case encapsule une seule action metier et retourne un `sealed interface` result.

| Use Case | Input | Output | Description |
|----------|-------|--------|-------------|
| `LoginUseCase` | email, password | Success / ErrorAuth | Connexion via AuthService |
| `SignUpUseCase` | email, password, firstName, lastName, role | Success / ErrorAuth | Inscription + createUser Cloud Function |
| `LogoutUseCase` | - | Success / ErrorAuth | Deconnexion Firebase + Google |
| `IsAuthenticateUseCase` | - | Success(bool) / ErrorAuth | Verification de l'etat d'auth |
| `GetRoleUseCase` | - | Customer / Driver / ErrorAuth | Recupe le role depuis les custom claims |
| `GetAllProductUseCase` | - | Success(products) / Error | Liste tous les produits |
| `GetProductByIdUseCase` | id | Success(product) / Error | Produit par ID |
| `PlaceOrderUseCase` | lat, lng, address | Success(orderId, code) / Error | Passe commande via Cloud Function + vide le panier |
| `AcceptOrderUseCase` | orderId | Success / Error | Livreur accepte une commande |

---

## Repositories

### CartRepository
- **Stockage** : En memoire avec `MutableStateFlow<List<Cart>>`
- **Scope** : `@Singleton` via Hilt
- **Methodes** :
  - `items: StateFlow<List<Cart>>` - Etat reactif du panier
  - `addProduct(product, quantity)` - Ajouter/incrementer
  - `removeProduct(productId)` - Retirer un produit
  - `clearCart()` - Vider le panier
  - `getTotal(): Double` - Calculer le total

### ProductRepository
- **Source** : Firestore collection `products`
- **Methodes** :
  - `getAllProduct(): List<Product>` - Tous les produits
  - `getProductById(id): Product?` - Produit par ID

### OrderRepository
- **Source** : Firestore collection `orders`
- **Methodes** :
  - `getOrdersByCustomerId(uid): List<Order>` - Commandes d'un client
  - `getOrdersByDriverId(uid): List<Order>` - Commandes d'un livreur
  - `getOrderById(id): Order?` - Commande par ID
  - `listenToOrder(id, callback)` - Ecoute en temps reel (snapshots)
  - `updateOrderStatus(id, status)` - Mise a jour du statut

### UserRepository
- **Source** : Firestore collection `users`
- **Methodes** :
  - `getUserById(uid): User?` - Profil utilisateur
  - `updateFcmToken(uid, token)` - Mise a jour du token FCM

---

## Services Firebase

### AuthService
- `login(email, password)` - Connexion Firebase Auth
- `signUp(email, password)` - Inscription
- `signOut()` - Deconnexion
- `sendEmailVerification(user)` - Email de verification
- `isAuthenticated(): Boolean` - Etat d'authentification
- `currentUser(): FirebaseUser?` - Utilisateur courant
- `getRole(): Role` - Role depuis les custom claims

### CloudFunctionsService
- `createUser(role, email, firstName, lastName)` - Appel `createUser` CF
- `createOrder(items, dropoff)` - Appel `createOrder` CF
- `acceptOrder(orderId)` - Appel `acceptOrder` CF
- `validateOrder(orderId, code)` - Appel `validateOrder` CF
- `submitRating(orderId, rating, comment?)` - Appel `submitRating` CF
- `updateUser(firstName, lastName, email?)` - Appel `updateUser` CF

### GoogleAuthService
- `signInWithGoogle()` - Connexion Google One Tap
- `clearCredentials()` - Nettoyage des credentials Google

### PotionGoMessagingService
- Etend `FirebaseMessagingService`
- Reception des notifications FCM (nouvelles commandes pour les livreurs)
- Gestion du token FCM (enregistrement dans Firestore)

---

## Ecrans

### Authentification

#### LoginScreen
- Formulaire email/mot de passe
- Lien vers l'inscription
- Gestion des erreurs (credentials invalides)

#### SignUpScreen
- Formulaire : email, mot de passe, prenom, nom
- Selection du role (customer/driver)
- Envoi d'email de verification

### Client

#### HomeScreen
- Grille de produits avec images (Coil)
- Navigation basee sur le role (customer vs driver)
- Barre de navigation inferieure

#### ProductDetailScreen
- Image, nom, prix, mood, description
- Bouton "Ajouter au panier"

#### CartScreen
- Liste des articles du panier
- Quantite, prix unitaire, total
- Bouton suppression par article
- Total general + bouton "Payer"

#### CheckoutScreen
- Carte Google Maps interactive (selection de l'adresse de livraison)
- Champ adresse de livraison
- Resume de la commande
- Ecran de succes avec code de validation

#### OrderTrackingScreen
- Suivi en temps reel de la commande (Firestore snapshots)
- Carte avec position du livreur (Realtime DB)
- Statut de la commande en direct
- Code de validation visible

### Livreur

#### OrderRequestScreen (Driver)
- Details de la commande a accepter
- Carte avec point de livraison
- Boutons Accepter / Refuser
- Ecran de chargement et d'erreur

#### ProfileScreen
- Informations du profil
- Modification du prenom, nom, email
- Note moyenne et evaluations recues
- Bouton de deconnexion

---

## Navigation

### AppNavGraph
Navigation basee sur un enum `AppScreenDestination` :

```kotlin
enum class AppScreenDestination(val route: String) {
    LOGIN("login"),
    SIGNUP("signup"),
    HOME("home"),
    PRODUCT_DETAIL("product/{productId}"),
    CART("cart"),
    CHECKOUT("checkout"),
    ORDER_TRACKING("tracking/{orderId}"),
    ORDER_REQUEST("order-request/{orderId}"),
    PROFILE("profile")
}
```

### Navigation par role
- **Customer** : Home → Detail produit → Panier → Checkout → Suivi commande → Profil
- **Driver** : Home (commandes en attente) → Request → Suivi livraison → Profil
- **BottomBar** : Accueil, Panier (customer) / Commandes (driver), Profil

---

## Injection de dependances (Hilt)

### Configuration
- `App.kt` : `@HiltAndroidApp`
- `MainActivity.kt` : `@AndroidEntryPoint`

### Modules (`@InstallIn(SingletonComponent::class)`)
- Repositories : `CartRepository`, `OrderRepository`, `ProductRepository`, `UserRepository`
- Services : `AuthService`, `CloudFunctionsService`, `GoogleAuthService`

### ViewModels
Tous les ViewModels utilisent `@HiltViewModel` avec `@Inject constructor()`.

---

## Theme Material 3

### Couleurs (`Color.kt`)
Palette personnalisee avec variantes light/dark pour :
- Primary, Secondary, Tertiary
- Background, Surface
- Error

### Typographie (`Type.kt`)
Configuration Material 3 avec les styles :
- displayLarge/Medium/Small
- headlineLarge/Medium/Small
- bodyLarge/Medium/Small
- labelLarge/Medium/Small

### Theme (`Theme.kt`)
- `PotionGoTheme` composable wrapper
- Support automatique du mode sombre systeme
- Dynamic color support (Android 12+)

---

## Composants reutilisables

### PotionGoScaffold
Scaffold commun a tous les ecrans :
- TopAppBar avec titre et bouton retour optionnel
- BottomBar optionnelle
- Content area avec padding

### BottomBar
Barre de navigation inferieure :
- Items adaptes au role (customer vs driver)
- Indicateur de selection actif
- Navigation entre les ecrans principaux

### ProductCard
Carte produit pour la grille :
- Image (Coil AsyncImage)
- Nom, prix, mood
- Action au clic

### ProductGrid
Grille responsive de ProductCards :
- LazyVerticalGrid avec 2 colonnes
- Espacement automatique

---

## Internationalisation

L'application supporte le francais et l'anglais via les fichiers de ressources :
- `res/values/strings.xml` - Anglais (defaut)
- `res/values-fr/strings.xml` - Francais

Toutes les chaines visibles utilisent `stringResource(R.string.*)`.

---

## Configuration Gradle

### Plugins
- `com.android.application`
- `org.jetbrains.kotlin.android`
- `org.jetbrains.kotlin.plugin.compose`
- `com.google.gms.google-services`
- `com.google.devtools.ksp`
- `com.google.dagger.hilt.android`

### Dependances principales

| Dependance | Usage |
|------------|-------|
| `androidx.compose.*` | UI Jetpack Compose |
| `androidx.navigation:navigation-compose` | Navigation |
| `androidx.hilt:hilt-navigation-compose` | Hilt + Navigation |
| `com.google.dagger:hilt-android` | Injection de dependances |
| `com.google.firebase:firebase-auth-ktx` | Authentification |
| `com.google.firebase:firebase-firestore-ktx` | Base de donnees |
| `com.google.firebase:firebase-database-ktx` | Realtime Database |
| `com.google.firebase:firebase-functions-ktx` | Cloud Functions |
| `com.google.firebase:firebase-messaging-ktx` | Notifications push |
| `com.google.maps.android:maps-compose` | Google Maps |
| `io.coil-kt:coil-compose` | Chargement d'images |
| `com.google.android.libraries.identity.googleid` | Google Sign-In |

---

## Permissions Android

- `INTERNET` - Acces reseau
- `ACCESS_FINE_LOCATION` - Localisation precise (livreurs)
- `ACCESS_COARSE_LOCATION` - Localisation approximative
- `POST_NOTIFICATIONS` - Notifications push (Android 13+)
