package com.example.potiongo.ui.screens.profile

import com.example.potiongo.data.User

sealed class ProfileUiState {
    data object Idle : ProfileUiState()
    data object Loading : ProfileUiState()
    data class Loaded(val user: User) : ProfileUiState()
    data object SignedOut : ProfileUiState()
    data class Error(val error: String) : ProfileUiState()
}
