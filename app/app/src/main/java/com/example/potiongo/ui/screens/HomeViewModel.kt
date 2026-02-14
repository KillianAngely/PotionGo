package com.example.potiongo.ui.screens

import android.annotation.SuppressLint
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
import com.example.potiongo.repository.OrderRepository
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    val getRoleUseCase: GetRoleUseCase,
    val getAllProductUseCase: GetAllProductUseCase,
    private val orderRepository: OrderRepository,
    private val sendLocationUseCase: SendLocationUseCase,
    private val fusedLocationClient: FusedLocationProviderClient
): ViewModel() {
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.CustomerView)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private var locationCallback: LocationCallback? = null

    init {
        witchRole()
    }

    fun witchRole(){
        viewModelScope.launch {
            when(val res = getRoleUseCase()){
                is GetRoleUseCaseResult.Customer -> {
                    _uiState.value = HomeUiState.CustomerView
                    getAllProduct()
                }
                is GetRoleUseCaseResult.Driver -> {
                    loadUnassignedOrders()
                }
                is GetRoleUseCaseResult.ErrorAuth -> {
                    _uiState.value = HomeUiState.Error(res.errorMessage)
                }
            }
        }
    }

    private fun loadUnassignedOrders() {
        viewModelScope.launch {
            try {
                val orders = orderRepository.getUnassignedOrders()
                _uiState.value = HomeUiState.DriverView(orders)
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Error loading unassigned orders", e)
                _uiState.value = HomeUiState.DriverView(emptyList())
            }
        }
    }

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

    @SuppressLint("MissingPermission")
    fun toggleLocationTracking() {
        val currentState = _uiState.value
        if (currentState !is HomeUiState.DriverView) return

        if (currentState.isSendingLocation) {
            stopLocationUpdates()
            _uiState.value = currentState.copy(isSendingLocation = false)
        } else {
            startLocationUpdates()
            _uiState.value = currentState.copy(isSendingLocation = true)
        }
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L)
            .setMinUpdateIntervalMillis(3000L)
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    sendLocationUseCase(location.latitude, location.longitude)
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
    }

    override fun onCleared() {
        super.onCleared()
        stopLocationUpdates()
    }
}
