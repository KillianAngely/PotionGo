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
import com.example.potiongo.ui.screens.auth.login.LoginUiState

@Composable
fun SignUpScreen(
    modifier: Modifier = Modifier ,
    onSubmit: () -> Unit,
    signUpViewModel: SignUpViewModel = hiltViewModel()
)
{
    val uiState by signUpViewModel.uiState.collectAsState()
    val activityContext = LocalContext.current

    Column(
        modifier.fillMaxSize() ,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TextField(
            value = signUpViewModel.email,
            onValueChange = { signUpViewModel.updateEmail(it) },
            label = { Text("Email") }
        )
        TextField(
            value = signUpViewModel.password,
            onValueChange = { signUpViewModel.updatePassword(it) },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation()
        )
        OutlinedButton(
            modifier = modifier,
            onClick = { signUpViewModel.signWithGoogle(activityContext) }
        ){
            Text("Sign with google")
        }
        Button(
            onClick = {
                signUpViewModel.signUp()
            }
        ) {
            Text("Click me!")
        }
    }
}