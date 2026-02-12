package com.example.potiongo.ui.component

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.BottomAppBar
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.sp
import com.example.potiongo.repository.CartRepository

@Composable
fun BottomAppBar(
    goToHomePage: () -> Unit,
    goToHistoryPage: () -> Unit,
    goToProfilePage: () -> Unit,
    goToCartPage: () -> Unit,
    cartRepository: CartRepository,
) {
    val cartItems by cartRepository.items.collectAsState()
    val cartCount = cartItems.sumOf { it.quantity }

    BottomAppBar {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            IconButton(onClick = goToHomePage) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Home, contentDescription = "Home")
                    Text("Home", fontSize = 12.sp)
                }
            }
            IconButton(onClick = goToCartPage) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    BadgedBox(
                        badge = {
                            if (cartCount > 0) {
                                Badge { Text("$cartCount") }
                            }
                        }
                    ) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = "Panier")
                    }
                    Text("Panier", fontSize = 12.sp)
                }
            }
            IconButton(onClick = goToHistoryPage) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.History, contentDescription = "History")
                    Text("History", fontSize = 12.sp)
                }
            }
            IconButton(onClick = goToProfilePage) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Person, contentDescription = "Profile")
                    Text("Profile", fontSize = 12.sp)
                }
            }
        }
    }
}
