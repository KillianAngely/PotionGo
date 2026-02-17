package com.example.potiongo.domain

import com.example.potiongo.services.CloudFunctionsService
import javax.inject.Inject

sealed interface SubmitRatingUseCaseResult {
    data object Success : SubmitRatingUseCaseResult
    data class Error(val message: String) : SubmitRatingUseCaseResult
}

class SubmitRatingUseCase @Inject constructor(
    private val cloudFunctionsService: CloudFunctionsService
) {
    suspend operator fun invoke(
        orderId: String,
        rating: Int,
        comment: String?
    ): SubmitRatingUseCaseResult {
        return try {
            cloudFunctionsService.submitRating(orderId, rating, comment)
            SubmitRatingUseCaseResult.Success
        } catch (e: Exception) {
            SubmitRatingUseCaseResult.Error(e.message ?: "Unknown error")
        }
    }
}
