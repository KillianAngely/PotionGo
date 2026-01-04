package com.example.potiongo.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.potiongo.ui.theme.PotionGoTheme


@Composable
fun LoginScreen(
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
        Text(
            text = "I'm the Login screen",
        )
        Button(
            onClick = onSubmit
        ) {
            Text("Click me!")
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    PotionGoTheme {
        LoginScreen(
            onSubmit = {  }
        )
    }
}