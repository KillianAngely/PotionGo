package com.example.potiongo.ui.screens.auth.signup

sealed class SignUpUiState{
    data object Idle : SignUpUiState()
    data object Success : SignUpUiState()
    data class Error(val error : String) : SignUpUiState()
    data object Loading : SignUpUiState()
}