package com.example.potiongo.ui.screens.profile

sealed class ProfileUiState {
    data object Idle :ProfileUiState()
    data object Success :ProfileUiState()
    data class Error(val error : String) :ProfileUiState()
    data object IsSignOut: ProfileUiState()
}