package com.example.potiongo.ui.screens.profile

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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.potiongo.ui.component.BottomBarNavigation
import com.example.potiongo.ui.component.PotionGoScaffold

@Composable
fun ProfileScreen(
    bottomBarNavigation: BottomBarNavigation,
    profileViewModel: ProfileViewModel = hiltViewModel(),
    onSignOut: ()-> Unit
) {
    val uiState by profileViewModel.uiState.collectAsState()
    val currentOnUserLogIn by rememberUpdatedState(onSignOut)
    LaunchedEffect(uiState)  {
        if(uiState == ProfileUiState.IsSignOut){
            currentOnUserLogIn()
        }
    }

    PotionGoScaffold(
        title = "Profil",
        showBottomBar = true,
        bottomBarNavigation = bottomBarNavigation
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            Button(
                onClick = {
                    profileViewModel.signOut()
                }
            ) {
                Text(
                    text = "Se déconnecter",
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}
