package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.repository.LocationRepository
import com.example.potiongo.services.AuthService
import javax.inject.Inject

private const val TAG: String = "SendLocationUseCase"

sealed interface SendLocationUseCaseResult {
    data object Success : SendLocationUseCaseResult
    data class Error(val errorMessage: String) : SendLocationUseCaseResult
}

class SendLocationUseCase @Inject constructor(
    private val locationRepository: LocationRepository,
    private val authService: AuthService
) {
    operator fun invoke(lat: Double, lng: Double): SendLocationUseCaseResult {
        return try {
            val uid = authService.getUid()
                ?: return SendLocationUseCaseResult.Error("User not authenticated")
            locationRepository.updateDriverLocation(uid, lat, lng)
            Log.d(TAG, "SendLocationUseCase:success lat=$lat lng=$lng")
            SendLocationUseCaseResult.Success
        } catch (e: Exception) {
            Log.d(TAG, "SendLocationUseCase:failed", e)
            SendLocationUseCaseResult.Error(e.message ?: "Unknown error")
        }
    }
}
