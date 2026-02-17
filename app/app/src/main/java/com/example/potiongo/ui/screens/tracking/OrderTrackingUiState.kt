package com.example.potiongo.ui.screens.tracking

import com.example.potiongo.data.Order
import com.example.potiongo.ui.screens.driver.OrderItemDetail
import com.google.android.gms.maps.model.LatLng

sealed class OrderTrackingUiState {
    data object Loading : OrderTrackingUiState()
    data class Tracking(
        val order: Order,
        val items: List<OrderItemDetail>,
        val driverLat: Double,
        val driverLng: Double,
        val total: Double,
        val routePoints: List<LatLng> = emptyList(),
        val estimatedArrival: String = ""
    ) : OrderTrackingUiState()
    data object Delivered : OrderTrackingUiState()
    data class Error(val message: String) : OrderTrackingUiState()
}
