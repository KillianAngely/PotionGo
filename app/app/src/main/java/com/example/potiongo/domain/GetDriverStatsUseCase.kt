package com.example.potiongo.domain

import com.example.potiongo.data.DriverStats
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.repository.ProductRepository
import com.example.potiongo.repository.UserRepository
import com.example.potiongo.services.AuthService
import javax.inject.Inject

sealed class GetDriverStatsUseCaseResult {
    data class Success(val stats: DriverStats) : GetDriverStatsUseCaseResult()
    data class Error(val message: String) : GetDriverStatsUseCaseResult()
}

class GetDriverStatsUseCase @Inject constructor(
    private val orderRepository: OrderRepository,
    private val productRepository: ProductRepository,
    private val userRepository: UserRepository,
    private val authService: AuthService
) {
    suspend operator fun invoke(): GetDriverStatsUseCaseResult {
        return try {
            val uid = authService.getUid() ?: return GetDriverStatsUseCaseResult.Error("Not authenticated")
            val user = userRepository.getUserInfo(uid)

            val deliveredOrders = orderRepository.getDeliveredOrdersForDriver(uid)
            val rejectedCount = orderRepository.getRejectedCountForDriver(uid)
            val totalDeliveries = deliveredOrders.size

            // Calculate revenue by joining orders with products
            val allProducts = productRepository.getAllProduct()
            val productPrices = allProducts.associate { it.id to it.price }

            var totalRevenue = 0.0
            for (order in deliveredOrders) {
                for (item in order.items) {
                    val price = productPrices[item.potionId] ?: 0.0
                    totalRevenue += price * item.quantity
                }
            }

            // Acceptance rate = delivered / (delivered + rejected)
            val totalActions = totalDeliveries + rejectedCount
            val acceptanceRate = if (totalActions > 0) {
                (totalDeliveries.toDouble() / totalActions) * 100.0
            } else {
                100.0
            }

            GetDriverStatsUseCaseResult.Success(
                DriverStats(
                    totalDeliveries = totalDeliveries,
                    totalRevenue = totalRevenue,
                    acceptanceRate = acceptanceRate,
                    averageRating = user?.averageRating ?: 0.0,
                    totalRatings = user?.totalRatings ?: 0
                )
            )
        } catch (e: Exception) {
            GetDriverStatsUseCaseResult.Error(e.message ?: "Unknown error")
        }
    }
}
