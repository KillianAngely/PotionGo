package com.example.potiongo.ui.screens


import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.potiongo.ui.theme.PotionGoTheme
import com.example.potiongo.ui.component.BottomAppBar
import com.example.potiongo.ui.component.ProductGrid


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    homeViewModel: HomeViewModel = hiltViewModel(),
    onSignOut: () -> Unit,
    goToHomeScreen: () -> Unit,
    goToHistoryScreen: () -> Unit,
    goToProfileScreen: () -> Unit,
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
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("PotionGo")
                }
            )
        },
        bottomBar = { BottomAppBar(
            goToHomeScreen,
            goToHistoryScreen,
            goToProfileScreen
        ) }
        ,
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

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    PotionGoTheme {
        HomeScreen(
            onSignOut = {},
            goToHomeScreen = {},
            goToHistoryScreen = {},
            goToProfileScreen = {},
            onSelectProduct = {}
        )
    }
}