package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.CloudFunctionsService
import javax.inject.Inject

sealed interface AcceptOrderUseCaseResult {
    data object Success : AcceptOrderUseCaseResult
    data class Error(val message: String) : AcceptOrderUseCaseResult
}

class AcceptOrderUseCase @Inject constructor(
    private val cloudFunctionsService: CloudFunctionsService
) {
    suspend operator fun invoke(orderId: String): AcceptOrderUseCaseResult {
        return try {
            cloudFunctionsService.acceptOrder(orderId)
            AcceptOrderUseCaseResult.Success
        } catch (e: Exception) {
            Log.e("AcceptOrderUseCase", "Failed to accept order", e)
            AcceptOrderUseCaseResult.Error(e.message ?: "Erreur inconnue")
        }
    }
}
