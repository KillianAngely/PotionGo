package com.example.potiongo.ui.screens.tracking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.repository.LocationRepository
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.repository.ProductRepository
import com.example.potiongo.ui.screens.driver.OrderItemDetail
import com.google.firebase.database.ValueEventListener
import com.google.firebase.firestore.ListenerRegistration
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrderTrackingViewModel @Inject constructor(
    private val orderRepository: OrderRepository,
    private val productRepository: ProductRepository,
    private val locationRepository: LocationRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val orderId: String = savedStateHandle["orderId"] ?: ""

    private val _uiState = MutableStateFlow<OrderTrackingUiState>(OrderTrackingUiState.Loading)
    val uiState: StateFlow<OrderTrackingUiState> = _uiState.asStateFlow()

    private var driverLocationListener: ValueEventListener? = null
    private var driverIdForListener: String? = null
    private var orderStatusListener: ListenerRegistration? = null

    init {
        loadOrderDetails()
    }

    private fun loadOrderDetails() {
        viewModelScope.launch {
            try {
                val order = orderRepository.getOrderById(orderId)
                if (order == null) {
                    _uiState.value = OrderTrackingUiState.Error("Commande introuvable")
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

                val total = items.sumOf { it.price * it.quantity }

                _uiState.value = OrderTrackingUiState.Tracking(
                    order = order,
                    items = items,
                    driverLat = 0.0,
                    driverLng = 0.0,
                    total = total
                )

                if (!order.driverId.isNullOrEmpty()) {
                    startDriverLocationListener(order.driverId)
                }
                startOrderStatusListener(orderId)
            } catch (e: Exception) {
                _uiState.value = OrderTrackingUiState.Error(e.message ?: "Erreur inconnue")
            }
        }
    }

    private fun startDriverLocationListener(driverId: String) {
        stopDriverLocationListener()
        driverIdForListener = driverId
        driverLocationListener = locationRepository.listenToDriverLocation(driverId) { lat, lng ->
            val current = _uiState.value
            if (current is OrderTrackingUiState.Tracking) {
                _uiState.value = current.copy(driverLat = lat, driverLng = lng)
            }
        }
    }

    private fun stopDriverLocationListener() {
        val listener = driverLocationListener ?: return
        val driverId = driverIdForListener ?: return
        locationRepository.stopListeningDriverLocation(driverId, listener)
        driverLocationListener = null
        driverIdForListener = null
    }

    private fun startOrderStatusListener(orderId: String) {
        stopOrderStatusListener()
        orderStatusListener = orderRepository.listenToOrderStatus(orderId) { status ->
            if (status == "DELIVERED") {
                stopDriverLocationListener()
                stopOrderStatusListener()
                _uiState.value = OrderTrackingUiState.Delivered
            }
        }
    }

    private fun stopOrderStatusListener() {
        orderStatusListener?.remove()
        orderStatusListener = null
    }

    override fun onCleared() {
        super.onCleared()
        stopDriverLocationListener()
        stopOrderStatusListener()
    }
}
