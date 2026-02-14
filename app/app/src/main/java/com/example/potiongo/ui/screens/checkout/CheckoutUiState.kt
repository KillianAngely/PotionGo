package com.example.potiongo.ui.screens.checkout

import com.example.potiongo.data.Cart

sealed class CheckoutUiState {
    data class Ready(
        val items: List<Cart>,
        val total: Double,
        val selectedLat: Double,
        val selectedLng: Double,
        val deliveryAddress: String = ""
    ) : CheckoutUiState()

    data object Loading : CheckoutUiState()
    data class Success(val orderId: String) : CheckoutUiState()
    data class Error(val error: String) : CheckoutUiState()
}
