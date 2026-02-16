package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.CloudFunctionsService
import javax.inject.Inject

sealed interface ValidateOrderUseCaseResult {
    data object Success : ValidateOrderUseCaseResult
    data class Error(val message: String) : ValidateOrderUseCaseResult
}

class ValidateOrderUseCase @Inject constructor(
    private val cloudFunctionsService: CloudFunctionsService
) {
    suspend operator fun invoke(orderId: String, code: String): ValidateOrderUseCaseResult {
        return try {
            cloudFunctionsService.validateOrder(orderId, code)
            ValidateOrderUseCaseResult.Success
        } catch (e: Exception) {
            Log.e("ValidateOrderUseCase", "Failed to validate order", e)
            ValidateOrderUseCaseResult.Error(e.message ?: "Code incorrect")
        }
    }
}
