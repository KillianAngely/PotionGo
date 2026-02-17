package com.example.potiongo.domain

import com.example.potiongo.services.CloudFunctionsService
import javax.inject.Inject

sealed interface RejectOrderUseCaseResult {
    data object Success : RejectOrderUseCaseResult
    data class Error(val message: String) : RejectOrderUseCaseResult
}

class RejectOrderUseCase @Inject constructor(
    private val cloudFunctionsService: CloudFunctionsService
) {
    suspend operator fun invoke(orderId: String): RejectOrderUseCaseResult {
        return try {
            cloudFunctionsService.rejectOrder(orderId)
            RejectOrderUseCaseResult.Success
        } catch (e: Exception) {
            RejectOrderUseCaseResult.Error(e.message ?: "Erreur inconnue")
        }
    }
}
