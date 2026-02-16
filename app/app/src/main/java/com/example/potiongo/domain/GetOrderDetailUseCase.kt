package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.OrderDetail
import com.example.potiongo.data.OrderDetailItem
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.repository.ProductRepository
import com.example.potiongo.repository.UserRepository
import javax.inject.Inject

private const val TAG: String = "GetOrderDetailUseCase"

sealed interface GetOrderDetailUseCaseResult {
    data class Success(val detail: OrderDetail) : GetOrderDetailUseCaseResult
    data object Error : GetOrderDetailUseCaseResult
}

class GetOrderDetailUseCase @Inject constructor(
    private val orderRepository: OrderRepository,
    private val userRepository: UserRepository,
    private val productRepository: ProductRepository
) {
    suspend operator fun invoke(orderId: String): GetOrderDetailUseCaseResult {
        return try {
            val order = orderRepository.getOrderById(orderId)
                ?: throw IllegalStateException("Order not found")

            val driverName = if (!order.driverId.isNullOrEmpty()) {
                val user = userRepository.getUserInfo(order.driverId)
                user?.let { "${it.firstName} ${it.lastName}" }
            } else {
                null
            }

            val items = order.items.mapNotNull { orderItem ->
                val product = productRepository.getProductById(orderItem.potionId)
                product?.let { OrderDetailItem(product = it, quantity = orderItem.quantity) }
            }

            Log.d(TAG, "GetOrderDetailUseCase:success")
            GetOrderDetailUseCaseResult.Success(
                OrderDetail(order = order, driverName = driverName, items = items)
            )
        } catch (e: Exception) {
            Log.d(TAG, "GetOrderDetailUseCase:failed", e)
            GetOrderDetailUseCaseResult.Error
        }
    }
}
