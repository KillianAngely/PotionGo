package com.example.potiongo.ui.screens.cart

import androidx.lifecycle.ViewModel
import com.example.potiongo.data.Cart
import com.example.potiongo.repository.CartRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

@HiltViewModel
class CartViewModel @Inject constructor(
    private val cartRepository: CartRepository
) : ViewModel() {

    val items: StateFlow<List<Cart>> = cartRepository.items

    fun getTotal(): Double = cartRepository.getTotal()

    fun removeProduct(productId: String) {
        cartRepository.removeProduct(productId)
    }
}
