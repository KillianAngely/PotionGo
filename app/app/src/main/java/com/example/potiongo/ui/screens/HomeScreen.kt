package com.example.potiongo.ui.screens


import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.potiongo.ui.component.BottomBarNavigation
import com.example.potiongo.ui.component.PotionGoScaffold
import com.example.potiongo.ui.component.ProductGrid


@Composable
fun HomeScreen(
    homeViewModel: HomeViewModel = hiltViewModel(),
    onSignOut: () -> Unit,
    bottomBarNavigation: BottomBarNavigation,
    onSelectProduct: (String) -> Unit
) {
    val uiState by homeViewModel.uiState.collectAsState()
    val product by homeViewModel.products.collectAsState()

    val currentOnUserLogIn by rememberUpdatedState(onSignOut)
    LaunchedEffect(uiState)  {
        if(uiState == HomeUiState.IsSignOut){
                currentOnUserLogIn()
        }
    }
    PotionGoScaffold(
        title = "PotionGo",
        showBottomBar = true,
        bottomBarNavigation = bottomBarNavigation
    ) { innerPadding ->
        Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding),
        verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
    ) {
            if(uiState is HomeUiState.CustomerView){
                ProductGrid(product,onProductClick = onSelectProduct)
            }
            if(uiState is HomeUiState.DriverView){
                Text("I am driver")
            }
            Button(
                onClick = {
                    homeViewModel.signOut()
                }
            ) {
                Text(
                    text = "SignOut",
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}
