package com.example.potiongo.ui.screens

import android.annotation.SuppressLint
import android.location.Location
import android.os.Looper
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.data.Product
import com.example.potiongo.domain.GetAllProductUseCase
import com.example.potiongo.domain.GetAllProductUseCaseResult
import com.example.potiongo.domain.GetRoleUseCase
import com.example.potiongo.domain.GetRoleUseCaseResult
import com.example.potiongo.domain.SendLocationUseCase
import com.example.potiongo.domain.ValidateOrderUseCase
import com.example.potiongo.domain.ValidateOrderUseCaseResult
import com.example.potiongo.repository.LocationRepository
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.services.AuthService
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import com.google.firebase.database.ValueEventListener
import com.google.firebase.firestore.ListenerRegistration
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val PROXIMITY_THRESHOLD_METERS = 20f

data class DriverLocation(val lat: Double, val lng: Double)

@HiltViewModel
class HomeViewModel @Inject constructor(
    val getRoleUseCase: GetRoleUseCase,
    val getAllProductUseCase: GetAllProductUseCase,
    private val orderRepository: OrderRepository,
    private val locationRepository: LocationRepository,
    private val authService: AuthService,
    private val sendLocationUseCase: SendLocationUseCase,
    private val validateOrderUseCase: ValidateOrderUseCase,
    private val fusedLocationClient: FusedLocationProviderClient
): ViewModel() {
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.CustomerView())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _driverLocation = MutableStateFlow<DriverLocation?>(null)
    val driverLocation: StateFlow<DriverLocation?> = _driverLocation.asStateFlow()

    private var locationCallback: LocationCallback? = null
    private var locationStarted = false

    // Customer: listen to driver position + order status
    private var driverLocationListener: ValueEventListener? = null
    private var driverIdForListener: String? = null
    private var orderStatusListener: ListenerRegistration? = null

    // Driver: active delivery tracking
    private var activeOrderId: String? = null
    private var dropoffLat: Double = 0.0
    private var dropoffLng: Double = 0.0
    private var dropoffAddress: String = ""
    private var reachedProximity = false

    init {
        witchRole()
    }

    fun witchRole(){
        viewModelScope.launch {
            when(val res = getRoleUseCase()){
                is GetRoleUseCaseResult.Customer -> {
                    stopLocationUpdates()
                    stopDriverLocationListener()
                    stopOrderStatusListener()
                    clearDeliveryTracking()
                    _uiState.value = HomeUiState.CustomerView()
                    getAllProduct()
                    loadActiveOrderForCustomer()
                }
                is GetRoleUseCaseResult.Driver -> {
                    stopDriverLocationListener()
                    stopOrderStatusListener()
                    loadDriverOrders()
                }
                is GetRoleUseCaseResult.ErrorAuth -> {
                    _uiState.value = HomeUiState.Error(res.errorMessage)
                }
            }
        }
    }

    // ── Customer ──

    private fun loadActiveOrderForCustomer() {
        viewModelScope.launch {
            try {
                val uid = authService.getUid() ?: return@launch
                val activeOrder = orderRepository.getActiveOrderForCustomer(uid)
                val currentState = _uiState.value
                if (currentState is HomeUiState.CustomerView) {
                    _uiState.value = currentState.copy(activeOrder = activeOrder)
                }
                if (activeOrder != null && !activeOrder.driverId.isNullOrEmpty()) {
                    startDriverLocationListener(activeOrder.driverId)
                    startCustomerOrderStatusListener(activeOrder.id)
                }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Error loading active order", e)
            }
        }
    }

    private fun startDriverLocationListener(driverId: String) {
        stopDriverLocationListener()
        driverIdForListener = driverId
        driverLocationListener = locationRepository.listenToDriverLocation(driverId) { lat, lng ->
            _driverLocation.value = DriverLocation(lat, lng)
        }
    }

    private fun stopDriverLocationListener() {
        val listener = driverLocationListener ?: return
        val driverId = driverIdForListener ?: return
        locationRepository.stopListeningDriverLocation(driverId, listener)
        driverLocationListener = null
        driverIdForListener = null
        _driverLocation.value = null
    }

    private fun startCustomerOrderStatusListener(orderId: String) {
        stopOrderStatusListener()
        orderStatusListener = orderRepository.listenToOrderStatus(orderId) { status ->
            if (status == "DELIVERED") {
                stopDriverLocationListener()
                stopOrderStatusListener()
                val currentState = _uiState.value
                if (currentState is HomeUiState.CustomerView) {
                    _uiState.value = currentState.copy(activeOrder = null, orderDelivered = true)
                }
            }
        }
    }

    private fun stopOrderStatusListener() {
        orderStatusListener?.remove()
        orderStatusListener = null
    }

    fun clearDeliveredFlag() {
        val currentState = _uiState.value
        if (currentState is HomeUiState.CustomerView) {
            _uiState.value = currentState.copy(orderDelivered = false)
        }
    }

    // ── Driver ──

    private fun loadDriverOrders() {
        viewModelScope.launch {
            try {
                val uid = authService.getUid() ?: return@launch
                val activeOrder = orderRepository.getActiveOrderForDriver(uid)
                if (activeOrder != null) {
                    activeOrderId = activeOrder.id
                    dropoffLat = activeOrder.dropoff.lat
                    dropoffLng = activeOrder.dropoff.lng
                    dropoffAddress = activeOrder.dropoff.address
                    reachedProximity = false
                    _uiState.value = HomeUiState.DriverView(
                        deliveryState = DriverDeliveryState.Navigating(
                            orderId = activeOrder.id,
                            dropoffLat = dropoffLat,
                            dropoffLng = dropoffLng,
                            dropoffAddress = dropoffAddress,
                            driverLat = 0.0,
                            driverLng = 0.0,
                            distanceMeters = 0f
                        )
                    )
                } else {
                    clearDeliveryTracking()
                    val orders = orderRepository.getUnassignedOrders()
                    _uiState.value = HomeUiState.DriverView(orders = orders)
                }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Error loading driver orders", e)
                _uiState.value = HomeUiState.DriverView(emptyList())
            }
        }
    }

    private fun clearDeliveryTracking() {
        activeOrderId = null
        dropoffLat = 0.0
        dropoffLng = 0.0
        dropoffAddress = ""
        reachedProximity = false
    }

    private fun updateDeliveryDistance(driverLat: Double, driverLng: Double) {
        val orderId = activeOrderId ?: return
        if (reachedProximity) return

        val results = FloatArray(1)
        Location.distanceBetween(driverLat, driverLng, dropoffLat, dropoffLng, results)
        val distance = results[0]

        val currentState = _uiState.value
        if (currentState !is HomeUiState.DriverView) return

        if (distance < PROXIMITY_THRESHOLD_METERS) {
            reachedProximity = true
            _uiState.value = currentState.copy(
                deliveryState = DriverDeliveryState.CodeEntry(orderId = orderId)
            )
        } else {
            _uiState.value = currentState.copy(
                deliveryState = DriverDeliveryState.Navigating(
                    orderId = orderId,
                    dropoffLat = dropoffLat,
                    dropoffLng = dropoffLng,
                    dropoffAddress = dropoffAddress,
                    driverLat = driverLat,
                    driverLng = driverLng,
                    distanceMeters = distance
                )
            )
        }
    }

    fun updateDeliveryCode(code: String) {
        val currentState = _uiState.value
        if (currentState !is HomeUiState.DriverView) return
        val delivery = currentState.deliveryState
        if (delivery !is DriverDeliveryState.CodeEntry) return
        _uiState.value = currentState.copy(
            deliveryState = delivery.copy(enteredCode = code.take(6), errorMessage = null)
        )
    }

    fun validateDeliveryCode() {
        val currentState = _uiState.value
        if (currentState !is HomeUiState.DriverView) return
        val delivery = currentState.deliveryState
        if (delivery !is DriverDeliveryState.CodeEntry) return
        val orderId = delivery.orderId

        _uiState.value = currentState.copy(deliveryState = DriverDeliveryState.Validating)
        viewModelScope.launch {
            when (val result = validateOrderUseCase(orderId, delivery.enteredCode)) {
                is ValidateOrderUseCaseResult.Success -> {
                    clearDeliveryTracking()
                    loadDriverOrders()
                }
                is ValidateOrderUseCaseResult.Error -> {
                    _uiState.value = currentState.copy(
                        deliveryState = delivery.copy(errorMessage = result.message)
                    )
                }
            }
        }
    }

    // ── Products ──

    fun getAllProduct(){
        viewModelScope.launch {
            when(val res = getAllProductUseCase()){
                is GetAllProductUseCaseResult.Success -> {
                    _products.value =  res.products
                }
                is GetAllProductUseCaseResult.Error -> {
                    _uiState.value = HomeUiState.ErrorProduct
                }
            }
        }
    }

    // ── Location tracking ──

    @SuppressLint("MissingPermission")
    fun startLocationTracking() {
        if (locationStarted) return
        locationStarted = true
        startLocationUpdates()
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        stopLocationUpdates()

        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L)
            .setMinUpdateIntervalMillis(3000L)
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    sendLocationUseCase(location.latitude, location.longitude)
                    updateDeliveryDistance(location.latitude, location.longitude)
                }
            }
        }

        fusedLocationClient.requestLocationUpdates(
            request,
            locationCallback!!,
            Looper.getMainLooper()
        )
    }

    private fun stopLocationUpdates() {
        locationCallback?.let {
            fusedLocationClient.removeLocationUpdates(it)
        }
        locationCallback = null
        locationStarted = false
    }

    override fun onCleared() {
        super.onCleared()
        stopLocationUpdates()
        stopDriverLocationListener()
        stopOrderStatusListener()
    }
}
