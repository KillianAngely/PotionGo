package com.example.potiongo.ui.screens.history

import com.example.potiongo.data.Order

sealed class HistoryUiState {
    data object Loading : HistoryUiState()
    data class Success(val orders: List<Order>) : HistoryUiState()
    data class Error(val message: String) : HistoryUiState()
}
