package com.example.potiongo.ui.screens

import com.example.potiongo.data.Order

sealed class HomeUiState{
    data class DriverView(
        val orders: List<Order> = emptyList(),
        val isSendingLocation: Boolean = false
    ) : HomeUiState()
    data object CustomerView: HomeUiState()
    data class Error(val error : String) : HomeUiState()
    data object ErrorProduct : HomeUiState()
}