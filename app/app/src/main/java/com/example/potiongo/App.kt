package com.example.potiongo

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.example.potiongo.ui.navigation.AppNavHost

@Composable
fun AppScreen(modifier: Modifier = Modifier ,navController: NavHostController = rememberNavController()){
    AppNavHost(navController = navController,modifier = modifier)
}