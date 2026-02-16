package com.example.potiongo.ui.screens.tracking

import com.example.potiongo.data.Order
import com.example.potiongo.ui.screens.driver.OrderItemDetail

sealed class OrderTrackingUiState {
    data object Loading : OrderTrackingUiState()
    data class Tracking(
        val order: Order,
        val items: List<OrderItemDetail>,
        val driverLat: Double,
        val driverLng: Double,
        val total: Double
    ) : OrderTrackingUiState()
    data object Delivered : OrderTrackingUiState()
    data class Error(val message: String) : OrderTrackingUiState()
}
