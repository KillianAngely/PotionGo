package com.example.potiongo.ui.screens.checkout

import android.content.Context
import android.location.Geocoder
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.PlaceOrderUseCase
import com.example.potiongo.domain.PlaceOrderUseCaseResult
import com.example.potiongo.repository.CartRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Locale
import javax.inject.Inject

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    private val cartRepository: CartRepository,
    private val placeOrderUseCase: PlaceOrderUseCase,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val geocoder = Geocoder(context, Locale.getDefault())
    private var forwardGeocodeJob: Job? = null

    private val _uiState = MutableStateFlow<CheckoutUiState>(
        CheckoutUiState.Ready(
            items = cartRepository.items.value,
            total = cartRepository.getTotal(),
            selectedLat = 48.8566,
            selectedLng = 2.3522
        )
    )
    val uiState: StateFlow<CheckoutUiState> = _uiState.asStateFlow()

    fun updateSelectedLocation(lat: Double, lng: Double) {
        val current = _uiState.value
        if (current is CheckoutUiState.Ready) {
            _uiState.value = current.copy(selectedLat = lat, selectedLng = lng)

            // Reverse geocoding : lat/lng → adresse texte
            viewModelScope.launch(Dispatchers.IO) {
                try {
                    @Suppress("DEPRECATION")
                    val addresses = geocoder.getFromLocation(lat, lng, 1)
                    if (!addresses.isNullOrEmpty()) {
                        val address = addresses[0].getAddressLine(0) ?: return@launch
                        val s = _uiState.value
                        if (s is CheckoutUiState.Ready) {
                            _uiState.value = s.copy(deliveryAddress = address)
                        }
                    }
                } catch (_: Exception) { }
            }
        }
    }

    fun updateAddress(address: String) {
        val current = _uiState.value
        if (current is CheckoutUiState.Ready) {
            _uiState.value = current.copy(deliveryAddress = address)

            // Forward geocoding avec debounce : adresse → lat/lng
            forwardGeocodeJob?.cancel()
            forwardGeocodeJob = viewModelScope.launch(Dispatchers.IO) {
                delay(500)
                if (address.length < 5) return@launch
                try {
                    @Suppress("DEPRECATION")
                    val results = geocoder.getFromLocationName(address, 1)
                    if (!results.isNullOrEmpty()) {
                        val location = results[0]
                        val s = _uiState.value
                        if (s is CheckoutUiState.Ready) {
                            _uiState.value = s.copy(
                                selectedLat = location.latitude,
                                selectedLng = location.longitude
                            )
                        }
                    }
                } catch (_: Exception) { }
            }
        }
    }

    fun placeOrder() {
        val current = _uiState.value
        if (current !is CheckoutUiState.Ready) return

        val lat = current.selectedLat
        val lng = current.selectedLng
        val address = current.deliveryAddress

        _uiState.value = CheckoutUiState.Loading

        viewModelScope.launch {
            when (val result = placeOrderUseCase(lat, lng, address)) {
                is PlaceOrderUseCaseResult.Success -> {
                    _uiState.value = CheckoutUiState.Success(result.orderId, result.validationCode)
                }
                is PlaceOrderUseCaseResult.Error -> {
                    _uiState.value = CheckoutUiState.Error(result.message)
                }
            }
        }
    }
}
