package com.example.potiongo.ui.navigation

import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.example.potiongo.ui.component.BottomBarNavigation
import com.example.potiongo.ui.screens.HomeScreen
import com.example.potiongo.ui.screens.auth.emailVerif.EmailVerifScreen
import com.example.potiongo.ui.screens.auth.login.LoginScreen
import com.example.potiongo.ui.screens.auth.roleSelection.RoleSelectionScreen
import com.example.potiongo.ui.screens.auth.signup.SignUpScreen
import com.example.potiongo.ui.screens.cart.CartScreen
import com.example.potiongo.ui.screens.checkout.CheckoutScreen
import com.example.potiongo.ui.screens.driver.ActiveDeliveryScreen
import com.example.potiongo.ui.screens.driver.OrderRequestScreen
import com.example.potiongo.ui.screens.history.HistoryScreen
import com.example.potiongo.ui.screens.history.OrderDetailScreen
import com.example.potiongo.ui.screens.order.ProductDetailScreen
import com.example.potiongo.ui.screens.profile.ProfileScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    appNavHostViewModel: AppNavHostViewModel = hiltViewModel()
){
    val isAuthenticated by appNavHostViewModel.isAuthenticated.collectAsState()

    val bottomBarNavigation = BottomBarNavigation(
        goToHome = { navController.navigate(AppScreenDestination.Home.name) },
        goToCart = { navController.navigate(AppScreenDestination.Cart.name) },
        goToHistory = { navController.navigate(AppScreenDestination.History.name) },
        goToProfile = { navController.navigate(AppScreenDestination.Profile.name) }
    )

    NavHost(
        navController = navController,
        startDestination = if (isAuthenticated) AppScreenDestination.Home.name else AppScreenDestination.Login.name,
        modifier = modifier
    ) {
        composable(route = AppScreenDestination.Login.name) {
            LoginScreen(
                modifier = modifier,
                onClickCreateAccount = {navController.navigate(AppScreenDestination.RoleSelection.name)},
                onLoginSuccess = {navController.navigate(AppScreenDestination.Home.name)}
            )
        }
        composable(route = AppScreenDestination.RoleSelection.name) {
            RoleSelectionScreen(
                onRoleSelected = { selectedRole ->
                    navController.navigate("${AppScreenDestination.SignUp.name}/$selectedRole")
                }
            )
        }
        composable(route = AppScreenDestination.Home.name) {
            HomeScreen(
                bottomBarNavigation = bottomBarNavigation,
                onSelectProduct = { productId ->
                    navController.navigate("product_detail/$productId")
                    Log.d("AppNavGraph","product_detail/$productId")
                },
                onOrderClick = { order ->
                    val address = order.dropoff.address.ifEmpty { "Adresse inconnue" }
                    navController.navigate(
                        "order_request/${order.id}/$address/${order.dropoff.lat}/${order.dropoff.lng}/${order.items.size}"
                    )
                }
            )
        }
        composable(
            route = "product_detail/{productId}",
            arguments = listOf(navArgument("productId") { type = NavType.StringType })
        ) {
            ProductDetailScreen(
                onBack = { navController.popBackStack() }
            )
        }
        composable(route = AppScreenDestination.Cart.name) {
            CartScreen(
                onClickPay = { navController.navigate(AppScreenDestination.Checkout.name) },
                bottomBarNavigation = bottomBarNavigation
            )
        }
        composable(route = AppScreenDestination.Checkout.name) {
           CheckoutScreen(
               onBack = { navController.popBackStack() },
               onOrderPlaced = {
                   navController.navigate(AppScreenDestination.Home.name) {
                       popUpTo(AppScreenDestination.Home.name) { inclusive = true }
                   }
               }
           )
        }
        composable(route = AppScreenDestination.History.name){
            HistoryScreen(
                bottomBarNavigation = bottomBarNavigation,
                onOrderClick = { orderId ->
                    navController.navigate("order_detail/$orderId")
                }
            )
        }
        composable(
            route = "order_detail/{orderId}",
            arguments = listOf(navArgument("orderId") { type = NavType.StringType })
        ) {
            OrderDetailScreen(
                onBack = { navController.popBackStack() }
            )
        }
        composable(route = AppScreenDestination.Profile.name){
            ProfileScreen(
                bottomBarNavigation = bottomBarNavigation,
                onSignOut = {
                    navController.navigate(AppScreenDestination.Login.name) {
                        popUpTo(AppScreenDestination.Login.name) { inclusive = true }
                    }
                }
            )
        }
        composable(
            route = "${AppScreenDestination.SignUp.name}/{role}",
            arguments = listOf(navArgument("role") { type = NavType.StringType })
        ) { backStackEntry ->
            val selectedRole = backStackEntry.arguments?.getString("role") ?: "customer"
            SignUpScreen(
                role = selectedRole,
                onSignUpSuccess = { navController.navigate(AppScreenDestination.EmailVerif.name)},
            )
        }
        composable (route = AppScreenDestination.EmailVerif.name){
            EmailVerifScreen(
                onEmailVerif = { navController.navigate(AppScreenDestination.Home.name)},
            )
        }
        composable(
            route = "order_request/{orderId}/{dropoffAddress}/{dropoffLat}/{dropoffLng}/{itemCount}",
            arguments = listOf(
                navArgument("orderId") { type = NavType.StringType },
                navArgument("dropoffAddress") { type = NavType.StringType },
                navArgument("dropoffLat") { type = NavType.StringType },
                navArgument("dropoffLng") { type = NavType.StringType },
                navArgument("itemCount") { type = NavType.StringType },
            )
        ) {
            OrderRequestScreen(
                onAccepted = { orderId ->
                    navController.navigate("active_delivery/$orderId") {
                        popUpTo(AppScreenDestination.Home.name)
                    }
                },
                onRejected = { navController.popBackStack() }
            )
        }
        composable(
            route = "active_delivery/{orderId}",
            arguments = listOf(navArgument("orderId") { type = NavType.StringType })
        ) {
            ActiveDeliveryScreen(
                onDeliveryCompleted = {
                    navController.navigate(AppScreenDestination.Home.name) {
                        popUpTo(AppScreenDestination.Home.name) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }
    }
}
