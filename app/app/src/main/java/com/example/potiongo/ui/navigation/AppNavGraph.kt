package com.example.potiongo.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.potiongo.services.IAuthService
import com.example.potiongo.ui.screens.HomeScreen
import com.example.potiongo.ui.screens.auth.login.LoginScreen
import com.example.potiongo.ui.screens.auth.signup.SignUpScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    auth: IAuthService
){

    NavHost(
        navController = navController,
        startDestination = if (auth.isAuthenticated()) AppScreenDestination.Home.name else AppScreenDestination.Login.name,
        modifier = modifier
    ) {
        composable(route = AppScreenDestination.Login.name) {
            LoginScreen(
                onSubmit = { navController.navigate(AppScreenDestination.Home.name)},
                onClickCreateAccount = {navController.navigate(AppScreenDestination.SignUp.name)}
            )
        }
        composable(route = AppScreenDestination.Home.name){
            HomeScreen()
        }
        composable (route = AppScreenDestination.SignUp.name){
            SignUpScreen(
                onSubmit = { navController.navigate(AppScreenDestination.Home.name)},
            )
        }
    }
}