package com.example.potiongo.ui.screens.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.GetOrderHistoryUseCase
import com.example.potiongo.domain.GetOrderHistoryUseCaseResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val getOrderHistoryUseCase: GetOrderHistoryUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<HistoryUiState>(HistoryUiState.Loading)
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        loadOrders()
    }

    private fun loadOrders() {
        viewModelScope.launch {
            _uiState.value = HistoryUiState.Loading
            when (val result = getOrderHistoryUseCase()) {
                is GetOrderHistoryUseCaseResult.Success -> {
                    _uiState.value = HistoryUiState.Success(result.orders)
                }
                is GetOrderHistoryUseCaseResult.Error -> {
                    _uiState.value = HistoryUiState.Error("Impossible de charger l'historique")
                }
            }
        }
    }
}
