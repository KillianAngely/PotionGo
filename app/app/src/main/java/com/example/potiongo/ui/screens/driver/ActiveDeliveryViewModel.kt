package com.example.potiongo.ui.screens.driver

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.ValidateOrderUseCase
import com.example.potiongo.domain.ValidateOrderUseCaseResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ActiveDeliveryViewModel @Inject constructor(
    private val validateOrderUseCase: ValidateOrderUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val orderId: String = savedStateHandle["orderId"] ?: ""

    private val _uiState = MutableStateFlow<ActiveDeliveryUiState>(
        ActiveDeliveryUiState.InProgress(orderId = orderId)
    )
    val uiState: StateFlow<ActiveDeliveryUiState> = _uiState.asStateFlow()

    fun updateCode(code: String) {
        val current = _uiState.value
        if (current is ActiveDeliveryUiState.InProgress) {
            _uiState.value = current.copy(enteredCode = code.take(6), errorMessage = null)
        }
    }

    fun validateCode() {
        val current = _uiState.value
        if (current !is ActiveDeliveryUiState.InProgress) return

        _uiState.value = ActiveDeliveryUiState.Validating
        viewModelScope.launch {
            when (val result = validateOrderUseCase(orderId, current.enteredCode)) {
                is ValidateOrderUseCaseResult.Success -> {
                    _uiState.value = ActiveDeliveryUiState.Completed
                }
                is ValidateOrderUseCaseResult.Error -> {
                    _uiState.value = current.copy(errorMessage = result.message)
                }
            }
        }
    }
}
