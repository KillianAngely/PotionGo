package com.example.potiongo.ui.screens.driver

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.AcceptOrderUseCase
import com.example.potiongo.domain.AcceptOrderUseCaseResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrderRequestViewModel @Inject constructor(
    private val acceptOrderUseCase: AcceptOrderUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val orderId: String = savedStateHandle["orderId"] ?: ""
    private val dropoffAddress: String = savedStateHandle["dropoffAddress"] ?: ""
    private val dropoffLat: Double = (savedStateHandle.get<String>("dropoffLat") ?: "0.0").toDoubleOrNull() ?: 0.0
    private val dropoffLng: Double = (savedStateHandle.get<String>("dropoffLng") ?: "0.0").toDoubleOrNull() ?: 0.0
    private val itemCount: Int = (savedStateHandle.get<String>("itemCount") ?: "0").toIntOrNull() ?: 0

    private val _uiState = MutableStateFlow<OrderRequestUiState>(
        OrderRequestUiState.Ready(orderId, dropoffAddress, dropoffLat, dropoffLng, itemCount)
    )
    val uiState: StateFlow<OrderRequestUiState> = _uiState.asStateFlow()

    fun accept() {
        _uiState.value = OrderRequestUiState.Loading
        viewModelScope.launch {
            when (val result = acceptOrderUseCase(orderId)) {
                is AcceptOrderUseCaseResult.Success -> {
                    _uiState.value = OrderRequestUiState.Accepted(orderId)
                }
                is AcceptOrderUseCaseResult.Error -> {
                    _uiState.value = OrderRequestUiState.Error(result.message)
                }
            }
        }
    }
}
