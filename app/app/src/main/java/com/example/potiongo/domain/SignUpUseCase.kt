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
    suspend operator fun invoke(email: String,password: String,firstName: String,lastName: String): SignUpUseCaseResult {
        return try {
            val user = auth.signUp(email, password).user
                ?: return SignUpUseCaseResult.ErrorAuth("Unknown user")
            Log.d(TAG, "User après signup: ${auth.currentUser()}")
                auth.sendEmailVerification(user)
                cFunction.createUser("customer", email, firstName, lastName)
                Log.d(TAG, "SignUpUseCaseResult:success")
                SignUpUseCaseResult.Success

        } catch (e: Exception) {
            Log.d(TAG, "SignUpUseCaseResult9:failed", e)
            e.printStackTrace()
            SignUpUseCaseResult.ErrorAuth("Unknown error: ${e.message}")
        }
    }
}