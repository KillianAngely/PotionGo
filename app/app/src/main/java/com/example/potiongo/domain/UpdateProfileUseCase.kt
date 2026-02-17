package com.example.potiongo.domain

import com.example.potiongo.services.CloudFunctionsService
import javax.inject.Inject

sealed interface UpdateProfileUseCaseResult {
    data class Success(val emailChanged: Boolean) : UpdateProfileUseCaseResult
    data class Error(val message: String) : UpdateProfileUseCaseResult
}

class UpdateProfileUseCase @Inject constructor(
    private val cloudFunctionsService: CloudFunctionsService
) {
    suspend operator fun invoke(
        firstName: String,
        lastName: String,
        email: String?
    ): UpdateProfileUseCaseResult {
        return try {
            val result = cloudFunctionsService.updateUser(firstName, lastName, email)
            val emailChanged = result["emailChanged"] as? Boolean ?: false
            UpdateProfileUseCaseResult.Success(emailChanged)
        } catch (e: Exception) {
            UpdateProfileUseCaseResult.Error(e.message ?: "Unknown error")
        }
    }
}
