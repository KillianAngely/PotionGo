package com.example.potiongo.ui.screens


import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.flowWithLifecycle
import com.example.potiongo.ui.theme.PotionGoTheme
import kotlinx.coroutines.flow.filter


@Composable
fun HomeScreen(
    homeViewModel: HomeViewModel = hiltViewModel(),
    onSignOut: () -> Unit
) {
    val uiState by homeViewModel.uiState.collectAsState()

    val currentOnUserLogIn by rememberUpdatedState(onSignOut)
    LaunchedEffect(uiState)  {
        if(uiState == HomeUiState.IsSignOut){
                currentOnUserLogIn()
        }
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {

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

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    PotionGoTheme {
        HomeScreen(
            onSignOut = {}
        )
    }
}