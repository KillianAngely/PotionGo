package com.example.potiongo.ui.screens.driver

data class OrderItemDetail(
    val name: String,
    val price: Double,
    val quantity: Int
)

sealed class OrderRequestUiState {
    data class Ready(
        val orderId: String,
        val dropoffAddress: String,
        val dropoffLat: Double,
        val dropoffLng: Double,
        val items: List<OrderItemDetail>,
        val customerName: String,
        val customerEmail: String,
        val total: Double
    ) : OrderRequestUiState()

    data object Loading : OrderRequestUiState()
    data class Accepted(val orderId: String) : OrderRequestUiState()
    data object Rejected : OrderRequestUiState()
    data class Error(val message: String) : OrderRequestUiState()
}
