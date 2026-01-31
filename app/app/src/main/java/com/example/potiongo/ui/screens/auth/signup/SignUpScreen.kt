package com.example.potiongo.ui.screens.auth.signup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun SignUpScreen(
    modifier: Modifier = Modifier ,
    onSubmit: () -> Unit,
    viewModel: SignUpViewModel = hiltViewModel()
)
{
    val uiState by viewModel.uiState.collectAsState()
    val activityContext = LocalContext.current

    Column(
        modifier.fillMaxSize() ,
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
        TextField(
            value = uiState.confirmPassword,
            onValueChange = { viewModel.updatePassword(it) },
            label = { Text("Confirm password") },
            visualTransformation = PasswordVisualTransformation()
        )
        OutlinedButton(
            modifier = modifier,
            onClick = { viewModel.signWithGoogle(activityContext) }
        ){
            Text("Sign with google")
        }
        Button(
            onClick = {
                viewModel.signUp()
            }
        ) {
            Text("Click me!")
        }
    }
}