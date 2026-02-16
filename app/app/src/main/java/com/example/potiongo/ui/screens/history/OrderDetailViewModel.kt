package com.example.potiongo.ui.screens.history

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.GetOrderDetailUseCase
import com.example.potiongo.domain.GetOrderDetailUseCaseResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrderDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getOrderDetailUseCase: GetOrderDetailUseCase
) : ViewModel() {

    private val orderId: String = savedStateHandle["orderId"] ?: ""

    private val _uiState = MutableStateFlow<OrderDetailUiState>(OrderDetailUiState.Loading)
    val uiState: StateFlow<OrderDetailUiState> = _uiState.asStateFlow()

    init {
        loadOrderDetail()
    }

    private fun loadOrderDetail() {
        viewModelScope.launch {
            _uiState.value = OrderDetailUiState.Loading
            when (val result = getOrderDetailUseCase(orderId)) {
                is GetOrderDetailUseCaseResult.Success -> {
                    _uiState.value = OrderDetailUiState.Success(result.detail)
                }
                is GetOrderDetailUseCaseResult.Error -> {
                    _uiState.value = OrderDetailUiState.Error("Impossible de charger le detail")
                }
            }
        }
    }
}
