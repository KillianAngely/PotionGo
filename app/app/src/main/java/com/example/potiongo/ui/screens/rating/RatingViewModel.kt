package com.example.potiongo.ui.screens.rating

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.SubmitRatingUseCase
import com.example.potiongo.domain.SubmitRatingUseCaseResult
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.repository.UserRepository
import com.example.potiongo.services.AuthService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RatingViewModel @Inject constructor(
    private val orderRepository: OrderRepository,
    private val userRepository: UserRepository,
    private val authService: AuthService,
    private val submitRatingUseCase: SubmitRatingUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val orderId: String = savedStateHandle["orderId"] ?: ""

    private val _uiState = MutableStateFlow<RatingUiState>(RatingUiState.Loading)
    val uiState: StateFlow<RatingUiState> = _uiState.asStateFlow()

    init {
        loadOrderInfo()
    }

    private fun loadOrderInfo() {
        viewModelScope.launch {
            try {
                val order = orderRepository.getOrderById(orderId)
                if (order == null) {
                    _uiState.value = RatingUiState.Error("Order not found")
                    return@launch
                }

                val uid = authService.getUid() ?: run {
                    _uiState.value = RatingUiState.Error("Not authenticated")
                    return@launch
                }

                val isCustomer = order.customerId == uid
                val revieweeId = if (isCustomer) order.driverId else order.customerId

                if (revieweeId.isNullOrEmpty()) {
                    _uiState.value = RatingUiState.Error("No user to rate")
                    return@launch
                }

                val reviewee = userRepository.getUserInfo(revieweeId)
                val revieweeName = reviewee?.let { "${it.firstName} ${it.lastName}" } ?: "Unknown"

                _uiState.value = RatingUiState.Ready(
                    revieweeName = revieweeName,
                    isDriver = isCustomer
                )
            } catch (e: Exception) {
                _uiState.value = RatingUiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun updateRating(stars: Int) {
        val current = _uiState.value
        if (current is RatingUiState.Ready) {
            _uiState.value = current.copy(selectedRating = stars, error = null)
        }
    }

    fun updateComment(text: String) {
        val current = _uiState.value
        if (current is RatingUiState.Ready) {
            _uiState.value = current.copy(comment = text, error = null)
        }
    }

    fun submit() {
        val current = _uiState.value
        if (current !is RatingUiState.Ready) return
        if (current.selectedRating == 0) {
            _uiState.value = current.copy(error = "Please select a rating")
            return
        }

        viewModelScope.launch {
            _uiState.value = current.copy(isSending = true, error = null)
            val comment = current.comment.ifBlank { null }
            when (val result = submitRatingUseCase(orderId, current.selectedRating, comment)) {
                is SubmitRatingUseCaseResult.Success -> {
                    _uiState.value = RatingUiState.Submitted
                }
                is SubmitRatingUseCaseResult.Error -> {
                    _uiState.value = current.copy(isSending = false, error = result.message)
                }
            }
        }
    }
}
