package com.example.potiongo.ui.screens.order

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.data.Product
import com.example.potiongo.domain.GetProductByIdUseCase
import com.example.potiongo.domain.GetProductByIdUseCaseResult
import com.example.potiongo.repository.CartRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class ProductDetailUiState {
    data object Loading : ProductDetailUiState()
    data class Success(val product: Product) : ProductDetailUiState()
    data object Error : ProductDetailUiState()
    data object AddedToCart : ProductDetailUiState()
}

@HiltViewModel
class ProductDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val getProductByIdUseCase: GetProductByIdUseCase,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val productId: String = savedStateHandle["productId"] ?: ""

    private val _uiState = MutableStateFlow<ProductDetailUiState>(ProductDetailUiState.Loading)
    val uiState: StateFlow<ProductDetailUiState> = _uiState.asStateFlow()

    private var currentProduct: Product? = null

    init {
        loadProduct()
    }

    private fun loadProduct() {
        viewModelScope.launch {
            when (val res = getProductByIdUseCase(productId)) {
                is GetProductByIdUseCaseResult.Success -> {
                    currentProduct = res.product
                    _uiState.value = ProductDetailUiState.Success(res.product)
                }
                is GetProductByIdUseCaseResult.Error -> {
                    _uiState.value = ProductDetailUiState.Error
                }
            }
        }
    }

    fun addToCart() {
        currentProduct?.let { product ->
            cartRepository.addProduct(product)
            _uiState.value = ProductDetailUiState.AddedToCart
            // Reset to Success after showing confirmation
            _uiState.value = ProductDetailUiState.Success(product)
        }
    }
}
