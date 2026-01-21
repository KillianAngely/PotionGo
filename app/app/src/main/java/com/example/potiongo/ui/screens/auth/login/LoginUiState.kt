package com.example.potiongo.ui.screens.auth.login


sealed class LoginUiState{
    data object Idle : LoginUiState()
    data object Success : LoginUiState()
    data class Error(val error : String) : LoginUiState()
    data object Loading : LoginUiState()
}