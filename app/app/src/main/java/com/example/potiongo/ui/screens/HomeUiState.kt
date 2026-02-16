package com.example.potiongo.ui.screens

import com.example.potiongo.data.Order

sealed class HomeUiState{
    data class DriverView(
        val orders: List<Order> = emptyList(),
        val deliveryState: DriverDeliveryState? = null
    ) : HomeUiState()
    data class CustomerView(
        val activeOrder: Order? = null,
        val orderDelivered: Boolean = false
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
        val distanceMeters: Float
    ) : DriverDeliveryState()

    data class CodeEntry(
        val orderId: String,
        val enteredCode: String = "",
        val errorMessage: String? = null
    ) : DriverDeliveryState()

    data object Validating : DriverDeliveryState()
}
