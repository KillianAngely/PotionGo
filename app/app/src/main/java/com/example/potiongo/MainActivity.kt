package com.example.potiongo

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.compose.rememberNavController
import com.example.potiongo.ui.navigation.AppNavHost
import com.example.potiongo.ui.theme.PotionGoTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        requestNotificationPermission()

        enableEdgeToEdge()
        setContent {
                PotionGoTheme {
                    Surface(modifier = Modifier.fillMaxSize()) {
                        val navController = rememberNavController()
                        AppNavHost(
                            navController = navController,
                            modifier = Modifier.fillMaxSize(),
                        )
                        LaunchedEffect(Unit) {
                            handleNotificationIntent(navController)
                        }
                    }
            }
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this, Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 0)
            }
        }
    }

    private fun handleNotificationIntent(navController: androidx.navigation.NavHostController) {
        val navigateTo = intent?.getStringExtra("navigateTo") ?: return
        if (navigateTo == "order_request") {
            val orderId = intent.getStringExtra("orderId") ?: return
            val address = intent.getStringExtra("dropoffAddress") ?: ""
            val lat = intent.getStringExtra("dropoffLat") ?: "0.0"
            val lng = intent.getStringExtra("dropoffLng") ?: "0.0"
            val itemCount = intent.getStringExtra("itemCount") ?: "0"
            navController.navigate(
                "order_request/$orderId/$address/$lat/$lng/$itemCount"
            )
            intent.removeExtra("navigateTo")
        }
    }
}
