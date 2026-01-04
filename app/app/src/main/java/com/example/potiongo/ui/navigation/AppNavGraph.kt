package com.example.potiongo.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.potiongo.ui.screen.HomeScreen
import com.example.potiongo.ui.screen.LoginScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
){
    NavHost(
        navController = navController,
        startDestination = AppScreenDestination.Login.name,
        modifier = modifier
    ) {
        composable(route = AppScreenDestination.Login.name) {
            LoginScreen(onSubmit = { navController.navigate(AppScreenDestination.Home.name)})
        }
        composable(route = AppScreenDestination.Home.name){
            HomeScreen()
        }
    }
}