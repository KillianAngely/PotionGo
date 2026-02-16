package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.repository.CartRepository
import com.example.potiongo.services.CloudFunctionsService
import javax.inject.Inject

private const val TAG: String = "PlaceOrderUseCase"

sealed interface PlaceOrderUseCaseResult {
    data class Success(val orderId: String, val validationCode: String) : PlaceOrderUseCaseResult
    data class Error(val message: String) : PlaceOrderUseCaseResult
}

class PlaceOrderUseCase @Inject constructor(
    private val cloudFunctionsService: CloudFunctionsService,
    private val cartRepository: CartRepository
) {
    suspend operator fun invoke(
        deliveryLat: Double,
        deliveryLng: Double,
        deliveryAddress: String = ""
    ): PlaceOrderUseCaseResult {
        return try {
            val cartItems = cartRepository.items.value

            if (cartItems.isEmpty()) {
                return PlaceOrderUseCaseResult.Error("Le panier est vide")
            }

            val items = cartItems.map { cart ->
                mapOf<String, Any>(
                    "potionId" to cart.product.id,
                    "quantity" to cart.quantity
                )
            }
            val dropoff = mapOf<String, Any>(
                "address" to deliveryAddress,
                "lat" to deliveryLat,
                "lng" to deliveryLng
            )

            val result = cloudFunctionsService.createOrder(items, dropoff)
            cartRepository.clearCart()

            val orderId = result["orderId"] as String
            val validationCode = result["validationCode"] as String

            Log.d(TAG, "Order placed successfully: $orderId")
            PlaceOrderUseCaseResult.Success(orderId, validationCode)
        } catch (e: Exception) {
            Log.d(TAG, "PlaceOrderUseCase:failed", e)
            PlaceOrderUseCaseResult.Error(e.message ?: "Erreur inconnue")
        }
    }
}
