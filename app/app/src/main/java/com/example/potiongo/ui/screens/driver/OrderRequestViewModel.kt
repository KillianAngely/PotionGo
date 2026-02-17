package com.example.potiongo.ui.screens.driver

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.AcceptOrderUseCase
import com.example.potiongo.domain.AcceptOrderUseCaseResult
import com.example.potiongo.domain.RejectOrderUseCase
import com.example.potiongo.domain.RejectOrderUseCaseResult
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.repository.ProductRepository
import com.example.potiongo.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrderRequestViewModel @Inject constructor(
    private val acceptOrderUseCase: AcceptOrderUseCase,
    private val rejectOrderUseCase: RejectOrderUseCase,
    private val orderRepository: OrderRepository,
    private val productRepository: ProductRepository,
    private val userRepository: UserRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val orderId: String = savedStateHandle["orderId"] ?: ""

    private val _uiState = MutableStateFlow<OrderRequestUiState>(OrderRequestUiState.Loading)
    val uiState: StateFlow<OrderRequestUiState> = _uiState.asStateFlow()

    init {
        loadOrderDetails()
    }

    private fun loadOrderDetails() {
        viewModelScope.launch {
            try {
                val order = orderRepository.getOrderById(orderId)
                if (order == null) {
                    _uiState.value = OrderRequestUiState.Error("Commande introuvable")
                    return@launch
                }

                val items = order.items.mapNotNull { orderItem ->
                    val product = productRepository.getProductById(orderItem.potionId)
                    product?.let {
                        OrderItemDetail(
                            name = it.name,
                            price = it.price,
                            quantity = orderItem.quantity
                        )
                    }
                }

                val customer = userRepository.getUserInfo(order.customerId)
                val total = items.sumOf { it.price * it.quantity }

                _uiState.value = OrderRequestUiState.Ready(
                    orderId = orderId,
                    dropoffAddress = order.dropoff.address,
                    dropoffLat = order.dropoff.lat,
                    dropoffLng = order.dropoff.lng,
                    items = items,
                    customerName = "${customer?.firstName ?: ""} ${customer?.lastName ?: ""}".trim(),
                    customerEmail = customer?.email ?: "",
                    total = total
                )
            } catch (e: Exception) {
                _uiState.value = OrderRequestUiState.Error(e.message ?: "Erreur inconnue")
            }
        }
    }

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

    fun reject() {
        _uiState.value = OrderRequestUiState.Loading
        viewModelScope.launch {
            when (val result = rejectOrderUseCase(orderId)) {
                is RejectOrderUseCaseResult.Success -> {
                    _uiState.value = OrderRequestUiState.Rejected
                }
                is RejectOrderUseCaseResult.Error -> {
                    _uiState.value = OrderRequestUiState.Error(result.message)
                }
            }
        }
    }
}
