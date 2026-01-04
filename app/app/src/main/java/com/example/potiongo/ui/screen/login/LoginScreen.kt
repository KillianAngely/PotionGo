package com.example.potiongo.ui.screen.login


import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize

import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue


import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation

import androidx.compose.ui.tooling.preview.Preview

import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.potiongo.ui.theme.PotionGoTheme


@Composable
fun LoginScreen(
    modifier: Modifier = Modifier,
    onSubmit: () -> Unit,
    onClickCreateAccount: () -> Unit,
    viewModel: LoginViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TextField(
            value = uiState.email,
            onValueChange = { viewModel.updateEmail(it) },
            label = { Text("Email") }
        )
        TextField(
            value = uiState.password,
            onValueChange = { viewModel.updatePassword(it) },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation()
        )
        TextButton(onClick = onClickCreateAccount) {
            Text("I don't have account")
        }
        Button(onClick = { viewModel.login() }) {
            Text("Click me!")
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    PotionGoTheme {
        LoginScreen(
            onSubmit = {  } ,
            onClickCreateAccount = {}
        )
    }
}