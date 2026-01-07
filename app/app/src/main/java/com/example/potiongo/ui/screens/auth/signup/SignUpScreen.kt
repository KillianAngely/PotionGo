package com.example.potiongo.ui.screens.auth.signup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.potiongo.ui.components.ButtonSignInWithGoogle


@Composable
fun SignUpScreen(
    modifier: Modifier = Modifier ,
    onSubmit: () -> Unit,
    viewModel: SignUpViewModel = viewModel()
)
{
    val uiState by viewModel.uiState.collectAsState()
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
        ButtonSignInWithGoogle(webClientId = "527507288095-765jf2mmn11bvu93b1mtupooad5tm58t.apps.googleusercontent.com")
        Button(
            onClick = {
                viewModel.signUp()
            }
        ) {
            Text("Click me!")
        }
    }
}