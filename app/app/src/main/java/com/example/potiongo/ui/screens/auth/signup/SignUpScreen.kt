package com.example.potiongo.ui.screens.auth.signup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.potiongo.R

@Composable
fun SignUpScreen(
    role: String,
    modifier: Modifier = Modifier ,
    signUpViewModel: SignUpViewModel = hiltViewModel() ,
    onSignUpSuccess: () -> Unit
)
{
    val uiState by signUpViewModel.uiState.collectAsState()
    val activityContext = LocalContext.current

    LaunchedEffect(role) {
        signUpViewModel.updateRole(role)
    }

    LaunchedEffect(uiState) {
        if (uiState is SignUpUiState.Success) {
            onSignUpSuccess()
        }
    }

    Column(
        modifier.fillMaxSize() ,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        TextField(
            value = signUpViewModel.firstName,
            onValueChange = { signUpViewModel.updateFirstname(it) },
            label = { Text(stringResource(R.string.first_name)) }
        )
        TextField(
            value = signUpViewModel.lastName,
            onValueChange = { signUpViewModel.updateLastname(it) },
            label = { Text(stringResource(R.string.last_name)) }
        )
        TextField(
            value = signUpViewModel.email,
            onValueChange = { signUpViewModel.updateEmail(it) },
            label = { Text(stringResource(R.string.email_input)) }
        )
        TextField(
            value = signUpViewModel.password,
            onValueChange = { signUpViewModel.updatePassword(it) },
            label = { Text(stringResource(R.string.password_input)) },
            visualTransformation = PasswordVisualTransformation()
        )
        OutlinedButton(
            modifier = modifier,
            onClick = { signUpViewModel.signWithGoogle(activityContext) }
        ){
            Text(stringResource(R.string.sign_with_google))
        }
        Button(
            onClick = {
                signUpViewModel.signUp()
            }
        ) {
            Text(stringResource(R.string.sign_up))
        }
    }
}
