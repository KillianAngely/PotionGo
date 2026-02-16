package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Order
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.services.AuthService
import javax.inject.Inject

private const val TAG: String = "GetOrderHistoryUseCase"

sealed interface GetOrderHistoryUseCaseResult {
    data class Success(val orders: List<Order>) : GetOrderHistoryUseCaseResult
    data object Error : GetOrderHistoryUseCaseResult
}

class GetOrderHistoryUseCase @Inject constructor(
    private val orderRepository: OrderRepository,
    private val authService: AuthService,
    private val getRoleUseCase: GetRoleUseCase
) {
    suspend operator fun invoke(): GetOrderHistoryUseCaseResult {
        return try {
            val uid = authService.getUid() ?: throw IllegalStateException("User not authenticated")
            val role = getRoleUseCase()
            val orders = when (role) {
                is GetRoleUseCaseResult.Customer -> orderRepository.getOrdersByCustomerId(uid)
                is GetRoleUseCaseResult.Driver -> orderRepository.getOrdersByDriverId(uid)
                is GetRoleUseCaseResult.ErrorAuth -> throw IllegalStateException(role.errorMessage)
            }
            Log.d(TAG, "GetOrderHistoryUseCase:success:${orders.size} orders")
            GetOrderHistoryUseCaseResult.Success(orders)
        } catch (e: Exception) {
            Log.d(TAG, "GetOrderHistoryUseCase:failed", e)
            GetOrderHistoryUseCaseResult.Error
        }
    }
}
