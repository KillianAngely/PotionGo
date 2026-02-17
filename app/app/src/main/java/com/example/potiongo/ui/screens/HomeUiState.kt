package com.example.potiongo.ui.screens

import com.example.potiongo.data.Order
import com.google.android.gms.maps.model.LatLng

sealed class HomeUiState{
    data class DriverView(
        val orders: List<Order> = emptyList(),
        val deliveryState: DriverDeliveryState? = null,
        val pendingRatingOrderId: String? = null
    ) : HomeUiState()
    data class CustomerView(
        val activeOrder: Order? = null,
        val orderDelivered: Boolean = false,
        val lastDeliveredOrderId: String? = null
    ) : HomeUiState()
    data class Error(val error : String) : HomeUiState()
    data object ErrorProduct : HomeUiState()
}

sealed class DriverDeliveryState {
    data class Navigating(
        val orderId: String,
        val dropoffLat: Double,
        val dropoffLng: Double,
        val dropoffAddress: String,
        val driverLat: Double,
        val driverLng: Double,
        val distanceMeters: Float,
        val routePoints: List<LatLng> = emptyList(),
        val estimatedArrival: String = ""
    ) : DriverDeliveryState()

    data class CodeEntry(
        val orderId: String,
        val enteredCode: String = "",
        val errorMessage: String? = null
    ) : DriverDeliveryState()

    data object Validating : DriverDeliveryState()
}
