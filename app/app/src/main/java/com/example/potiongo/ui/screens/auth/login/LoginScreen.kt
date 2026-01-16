package com.example.potiongo.ui.screens.auth.login


import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.potiongo.R
import com.example.potiongo.ui.components.ButtonSignInWithGoogle
import com.example.potiongo.ui.theme.PotionGoTheme


@Composable
fun LoginScreen(
    modifier: Modifier = Modifier,
    onClickCreateAccount: () -> Unit,
    loginViewModel: LoginViewModel = hiltViewModel()
) {
    val uiState = loginViewModel.uiState.collectAsState().value

    Column(
        modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if(uiState.hasNetworkError){
            Text("Invalid Password or Something")
        }
        TextField(
            value = loginViewModel.email,
            onValueChange = { loginViewModel.updateEmail(it) },
            label = { Text(stringResource(R.string.email_input)) }
        )
        TextField(
            value = loginViewModel.password,
            onValueChange = { loginViewModel.updatePassword(it) },
            label = { Text(stringResource(R.string.password_input)) },
            visualTransformation = PasswordVisualTransformation()
        )
        TextButton(onClick = onClickCreateAccount) {
            Text(stringResource(R.string.signup_link))
        }
        ButtonSignInWithGoogle(webClientId = "527507288095-765jf2mmn11bvu93b1mtupooad5tm58t.apps.googleusercontent.com")
        Button(
            onClick = { loginViewModel.login() }
        ) {
            Text(stringResource(R.string.submit))
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    PotionGoTheme {
        LoginScreen(
            onClickCreateAccount = {}
        )
    }
}