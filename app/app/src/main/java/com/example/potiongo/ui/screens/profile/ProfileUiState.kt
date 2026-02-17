package com.example.potiongo.ui.screens.profile

import com.example.potiongo.data.DriverStats
import com.example.potiongo.data.User

sealed class ProfileUiState {
    data object Idle : ProfileUiState()
    data object Loading : ProfileUiState()
    data class Loaded(val user: User, val driverStats: DriverStats? = null) : ProfileUiState()
    data class Editing(
        val firstName: String,
        val lastName: String,
        val email: String,
        val originalEmail: String,
        val isSaving: Boolean = false,
        val error: String? = null
    ) : ProfileUiState()
    data class Saved(val emailChanged: Boolean) : ProfileUiState()
    data object SignedOut : ProfileUiState()
    data class Error(val error: String) : ProfileUiState()
}
