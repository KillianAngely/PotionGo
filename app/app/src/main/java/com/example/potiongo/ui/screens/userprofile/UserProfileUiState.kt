package com.example.potiongo.ui.screens.userprofile

import com.example.potiongo.data.Rating
import com.example.potiongo.data.User

sealed class UserProfileUiState {
    data object Loading : UserProfileUiState()
    data class Loaded(
        val user: User,
        val ratings: List<Rating>
    ) : UserProfileUiState()
    data class Error(val message: String) : UserProfileUiState()
}
