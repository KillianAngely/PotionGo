package com.example.potiongo.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.text.input.rememberTextFieldState
import androidx.compose.material3.Button
import androidx.compose.material3.SecureTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel


@Composable
fun SignUpScreen(
    modifier: Modifier = Modifier ,
    onSubmit: () -> Unit,
    viewModel: LoginViewModel = viewModel()
)
{
    Column(
        modifier.fillMaxSize() ,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TextField(
            state = rememberTextFieldState(initialText = "Hello"),
            label = { Text("Email")}
        )
        SecureTextField(
            state = rememberTextFieldState(initialText = ""),
            label = { Text("Password")}
        )
        SecureTextField(
            state = rememberTextFieldState(initialText = ""),
            label = { Text("Confirm Password")}
        )

        Button(
            onClick = onSubmit
        ) {
            Text("Click me!")
        }
    }
}