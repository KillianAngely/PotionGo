package com.example.potiongo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.example.potiongo.repository.CartRepository
import com.example.potiongo.ui.navigation.AppNavHost
import com.example.potiongo.ui.theme.PotionGoTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var cartRepository: CartRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()
        setContent {
                PotionGoTheme {
                    val navController = rememberNavController()
                    AppNavHost(
                        navController = navController,
                        cartRepository = cartRepository,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
        }
    }
}
