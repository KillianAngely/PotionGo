package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Order
import com.example.potiongo.data.OrderItem
import com.example.potiongo.data.OrderLocation
import com.example.potiongo.repository.CartRepository
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.services.AuthService
import javax.inject.Inject

private const val TAG: String = "PlaceOrderUseCase"

sealed interface PlaceOrderUseCaseResult {
    data class Success(val orderId: String) : PlaceOrderUseCaseResult
    data class Error(val message: String) : PlaceOrderUseCaseResult
}

class PlaceOrderUseCase @Inject constructor(
    private val orderRepository: OrderRepository,
    private val cartRepository: CartRepository,
    private val authService: AuthService
) {
    suspend operator fun invoke(
        deliveryLat: Double,
        deliveryLng: Double,
        deliveryAddress: String = ""
    ): PlaceOrderUseCaseResult {
        return try {
            val user = authService.getUser()
            val cartItems = cartRepository.items.value

            if (cartItems.isEmpty()) {
                return PlaceOrderUseCaseResult.Error("Le panier est vide")
            }

            val orderItems = cartItems.map { cart ->
                OrderItem(
                    potionId = cart.product.id,
                    quantity = cart.quantity
                )
            }

            val order = Order(
                customerId = user.uid,
                driverId = "",
                driverStart = OrderLocation(),
                dropoff = OrderLocation(
                    address = deliveryAddress,
                    lat = deliveryLat,
                    lng = deliveryLng
                ),
                items = orderItems,
                status = "PENDING"
            )

            val orderId = orderRepository.placeOrder(order)
            cartRepository.clearCart()

            Log.d(TAG, "Order placed successfully: $orderId")
            PlaceOrderUseCaseResult.Success(orderId)
        } catch (e: Exception) {
            Log.d(TAG, "PlaceOrderUseCase:failed", e)
            PlaceOrderUseCaseResult.Error(e.message ?: "Erreur inconnue")
        }
    }
}
