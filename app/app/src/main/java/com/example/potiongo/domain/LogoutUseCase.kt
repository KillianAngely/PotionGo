package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.AuthService
import com.example.potiongo.services.GoogleAuthService
import javax.inject.Inject


private const val TAG : String = "LogoutUseCase"
sealed interface LogoutUseCaseResult {
    data object Success : LogoutUseCaseResult
    data class ErrorAuth(val errorMessage :String) : LogoutUseCaseResult

}


class LogoutUseCase @Inject constructor(
    private val auth: AuthService,
    private val googleAuthService: GoogleAuthService
){
     suspend operator fun invoke(): LogoutUseCaseResult {
        return try {
            auth.signOut()
            googleAuthService.clearCredentials()
            Log.d(TAG, "LogoutUseCase:success")
            LogoutUseCaseResult.Success
        } catch (e: Exception) {
            Log.d(TAG, "LogoutUseCase:failed", e)
            e.printStackTrace()
            LogoutUseCaseResult.ErrorAuth("Unknown error: ${e.message}")
        }
    }
}