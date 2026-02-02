package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.AuthService
import com.example.potiongo.services.CloudFunctionsService
import com.example.potiongo.services.GoogleAuthService
import javax.inject.Inject


private const val TAG : String = "SignUpUseCase"
sealed interface SignUpUseCaseResult {
    data object Success : SignUpUseCaseResult
    data class ErrorAuth(val errorMessage :String) : SignUpUseCaseResult

}

class SignUpUseCase @Inject constructor(
    private val auth: AuthService,
    private val cFunction: CloudFunctionsService
) {
    suspend operator fun invoke(email: String,password: String): SignUpUseCaseResult {
        return try {
            auth.signUp(email, password)
            cFunction.setUserRole("customer")
            Log.d(TAG, "SignUpUseCaseResult:success")
            SignUpUseCaseResult.Success
        } catch (e: Exception) {
            Log.d(TAG, "LogoutUseCase:failed", e)
            e.printStackTrace()
            SignUpUseCaseResult.ErrorAuth("Unknown error: ${e.message}")
        }
    }
}