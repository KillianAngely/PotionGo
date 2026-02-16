package com.example.potiongo.ui.screens.rating

sealed class RatingUiState {
    data object Loading : RatingUiState()
    data class Ready(
        val revieweeName: String,
        val isDriver: Boolean,
        val selectedRating: Int = 0,
        val comment: String = "",
        val isSending: Boolean = false,
        val error: String? = null
    ) : RatingUiState()
    data object Submitted : RatingUiState()
    data class Error(val message: String) : RatingUiState()
}
