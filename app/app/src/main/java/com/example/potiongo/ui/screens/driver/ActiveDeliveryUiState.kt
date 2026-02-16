package com.example.potiongo.ui.screens.driver

sealed class ActiveDeliveryUiState {
    data class InProgress(
        val orderId: String = "",
        val enteredCode: String = "",
        val errorMessage: String? = null
    ) : ActiveDeliveryUiState()

    data object Validating : ActiveDeliveryUiState()
    data object Completed : ActiveDeliveryUiState()
}
