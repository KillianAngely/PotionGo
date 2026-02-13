package com.example.potiongo.repository

import com.example.potiongo.data.Product
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton
import com.example.potiongo.data.Cart



@Singleton
class CartRepository @Inject constructor() {

    private val _items = MutableStateFlow<List<Cart>>(emptyList())
    val items: StateFlow<List<Cart>> = _items.asStateFlow()

    fun addProduct(product: Product) {
        val current = _items.value.toMutableList()
        val index = current.indexOfFirst { it.product.id == product.id }
        if (index >= 0) {
            current[index] = current[index].copy(quantity = current[index].quantity + 1)
        } else {
            current.add(Cart(product))
        }
        _items.value = current
    }

    fun removeProduct(productId: String) {
        _items.value = _items.value.filter { it.product.id != productId }
    }

    fun getTotal(): Double {
        return _items.value.sumOf { it.product.price * it.quantity }
    }

    fun getItemCount(): Int {
        return _items.value.sumOf { it.quantity }
    }

    fun clearCart() {
        _items.value = emptyList()
    }
}
