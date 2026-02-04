package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.AuthService
import javax.inject.Inject


private const val TAG : String = "IsAuthenticateUseCase"

sealed interface IsAuthenticateUseCaseResult {
    data class Success(val isAuthenticated : Boolean) : IsAuthenticateUseCaseResult
    data object ErrorAuth : IsAuthenticateUseCaseResult
}

class IsAuthenticateUseCase @Inject constructor(
    private val auth: AuthService
) {
    operator fun invoke() : IsAuthenticateUseCaseResult {
        return try {
            val res = auth.isAuthenticated()
            if (res) {
                Log.d(TAG,"IsAuthenticateUseCase:success")
                 IsAuthenticateUseCaseResult.Success(true)
            } else {
                Log.d(TAG,"IsAuthenticateUseCase:success")
                 IsAuthenticateUseCaseResult.Success(false)
            }
        } catch (e: Exception) {
             Log.d(TAG, "IsAuthenticateUseCase:failed", e)
             IsAuthenticateUseCaseResult.ErrorAuth
        }
    }
}