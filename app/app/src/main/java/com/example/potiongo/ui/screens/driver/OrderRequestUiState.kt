package com.example.potiongo.ui.screens.driver

sealed class OrderRequestUiState {
    data class Ready(
        val orderId: String,
        val dropoffAddress: String,
        val dropoffLat: Double,
        val dropoffLng: Double,
        val itemCount: Int
    ) : OrderRequestUiState()

    data object Loading : OrderRequestUiState()
    data class Accepted(val orderId: String) : OrderRequestUiState()
    data class Error(val message: String) : OrderRequestUiState()
}
