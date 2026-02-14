package com.example.potiongo.ui.component

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.BottomAppBar
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.example.potiongo.repository.CartRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.map
import javax.inject.Inject

@HiltViewModel
class BottomBarViewModel @Inject constructor(
    cartRepository: CartRepository
) : ViewModel() {
    val cartCount = cartRepository.items.map { items ->
        items.sumOf { it.quantity }
    }
}

@Composable
fun PotionGoBottomBar(
    navigation: BottomBarNavigation,
    viewModel: BottomBarViewModel = hiltViewModel()
) {
    val cartCount by viewModel.cartCount.collectAsState(initial = 0)

    BottomAppBar {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    role = Role.Button,
                    onClick = navigation.goToHome
                )
            ) {
                Icon(Icons.Default.Home, contentDescription = "Home")
                Text("Home", fontSize = 12.sp)
            }
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    role = Role.Button,
                    onClick = navigation.goToCart
                )
            ) {
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
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    role = Role.Button,
                    onClick = navigation.goToHistory
                )
            ) {
                Icon(Icons.Default.History, contentDescription = "History")
                Text("History", fontSize = 12.sp)
            }
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    role = Role.Button,
                    onClick = navigation.goToProfile
                )
            ) {
                Icon(Icons.Default.Person, contentDescription = "Profile")
                Text("Profile", fontSize = 12.sp)
            }
        }
    }
}
