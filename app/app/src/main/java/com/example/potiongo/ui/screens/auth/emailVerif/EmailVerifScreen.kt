package com.example.potiongo.ui.screens.auth.emailVerif

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect


@Composable
fun EmailVerifScreen(
modifier: Modifier = Modifier,
emailVerifViewModel: EmailVerifViewModel = hiltViewModel(),
onEmailVerif : ()-> Unit
){
    val uiState by emailVerifViewModel.uiState.collectAsState()

    LifecycleEventEffect(event = Lifecycle.Event.ON_RESUME){
        emailVerifViewModel.isEmailVerified()
    }
    LaunchedEffect(uiState) {
        if (uiState is EmailVerifUiState.Success) {
            onEmailVerif()
        }
    }

    Column(
        modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator()
        Text(text = "hello")
    }

}

@Preview
@Composable
fun PreviewEmailVerifScreen(){
    EmailVerifScreen(
        modifier = Modifier.fillMaxSize(),
        onEmailVerif = {}
    )
}