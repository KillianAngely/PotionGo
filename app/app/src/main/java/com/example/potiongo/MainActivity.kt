package com.example.potiongo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.example.potiongo.services.AuthService
import com.example.potiongo.ui.navigation.AppNavHost
import com.example.potiongo.ui.theme.PotionGoTheme
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        FirebaseApp.initializeApp(this)

        val auth = AuthService(FirebaseAuth.getInstance())
        enableEdgeToEdge()
        setContent {
            PotionGoTheme {
                PotionGoTheme {
                    val navController = rememberNavController()
                    AppNavHost(
                        navController = navController,
                        modifier = Modifier.fillMaxSize(),
                        auth = auth
                    )
                }
            }
        }
    }
}