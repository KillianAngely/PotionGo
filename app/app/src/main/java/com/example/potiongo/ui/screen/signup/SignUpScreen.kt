package com.example.potiongo.ui.screen.signup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.text.input.rememberTextFieldState
import androidx.compose.material3.Button
import androidx.compose.material3.SecureTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.potiongo.ui.screen.login.LoginViewModel


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
        Button(
            onClick = { viewModel.signUp() }
        ) {
            Text("Click me!")
        }
    }
}