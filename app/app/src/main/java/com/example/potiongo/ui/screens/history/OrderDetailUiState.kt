package com.example.potiongo.ui.screens.history

import com.example.potiongo.data.OrderDetail

sealed class OrderDetailUiState {
    data object Loading : OrderDetailUiState()
    data class Success(val detail: OrderDetail) : OrderDetailUiState()
    data class Error(val message: String) : OrderDetailUiState()
}
