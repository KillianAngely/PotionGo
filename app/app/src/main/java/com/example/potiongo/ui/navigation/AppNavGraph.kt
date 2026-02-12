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
import com.example.potiongo.repository.CartRepository
import com.example.potiongo.ui.screens.HomeScreen
import com.example.potiongo.ui.screens.auth.emailVerif.EmailVerifScreen
import com.example.potiongo.ui.screens.auth.login.LoginScreen
import com.example.potiongo.ui.screens.auth.signup.SignUpScreen
import com.example.potiongo.ui.screens.cart.CartScreen
import com.example.potiongo.ui.screens.history.HistoryScreen
import com.example.potiongo.ui.screens.order.ProductDetailScreen
import com.example.potiongo.ui.screens.profile.ProfileScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    cartRepository: CartRepository,
    modifier: Modifier = Modifier,
    appNavHostViewModel: AppNavHostViewModel = hiltViewModel()
){
    val isAuthenticated by appNavHostViewModel.isAuthenticated.collectAsState()
    NavHost(
        navController = navController,
        startDestination = if (isAuthenticated) AppScreenDestination.Home.name else AppScreenDestination.Login.name,
        modifier = modifier
    ) {
        composable(route = AppScreenDestination.Login.name) {
            LoginScreen(
                onClickCreateAccount = {navController.navigate(AppScreenDestination.SignUp.name)},
                onLoginSuccess = {navController.navigate(AppScreenDestination.Home.name)}
            )
        }
        composable(route = AppScreenDestination.Home.name) {
            HomeScreen(
                onSignOut = { navController.navigate(AppScreenDestination.Login.name) {
                    popUpTo(AppScreenDestination.Login.name) { inclusive = true }
                }},
                goToHomeScreen = { navController.navigate(AppScreenDestination.Home.name) },
                goToHistoryScreen = { navController.navigate(AppScreenDestination.History.name) },
                goToProfileScreen = { navController.navigate(AppScreenDestination.Profile.name) },
                goToCartScreen = { navController.navigate(AppScreenDestination.Cart.name) },
                cartRepository = cartRepository,
                onSelectProduct = { productId ->
                    navController.navigate("product_detail/$productId")
                    Log.d("AppNavGraph","product_detail/$productId")
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
            CartScreen()
        }
        composable(route = AppScreenDestination.History.name){
            HistoryScreen()
        }
        composable(route = AppScreenDestination.Profile.name){
            ProfileScreen()
        }
        composable (route = AppScreenDestination.SignUp.name){
            SignUpScreen(
                onSignUpSuccess = { navController.navigate(AppScreenDestination.EmailVerif.name)},
            )
        }
        composable (route = AppScreenDestination.EmailVerif.name){
            EmailVerifScreen(
                onEmailVerif = { navController.navigate(AppScreenDestination.Home.name)},
            )
        }
    }
}
