package com.example.potiongo.ui.screens.profile

sealed class ProfileUiState {
    data object Idle : ProfileUiState()
    data object SignedOut : ProfileUiState()
    data class Error(val error: String) : ProfileUiState()
}
