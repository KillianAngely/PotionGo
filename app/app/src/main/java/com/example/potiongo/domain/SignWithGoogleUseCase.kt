package com.example.potiongo.domain

import android.content.Context
import android.util.Log
import com.example.potiongo.services.AuthService
import com.example.potiongo.services.GetGoogleIdTokenCredentialResult
import com.example.potiongo.services.GoogleAuthService
import javax.inject.Inject


class SignWithGoogleUseCase @Inject constructor(
    private val auth: AuthService,
    private val googleAuthService: GoogleAuthService
)  {
    suspend operator fun invoke(activityContext: Context) : SignWithGoogleUseCaseResult{
        when(val res = googleAuthService.getGoogleIdTokenCredential(activityContext)){
            is GetGoogleIdTokenCredentialResult.Success -> {
                val authResult = auth.signInWithCredential(res.credential)
                Log.d("UseCase", "User: ${authResult.user?.displayName}")
                Log.d("UseCase", "Email: ${authResult.user?.email}")
                auth.currentUser()
                return SignWithGoogleUseCaseResult.Success
            }
            is GetGoogleIdTokenCredentialResult.Error -> {
                return SignWithGoogleUseCaseResult.ErrorAuth("error usecase")
            }
        }

    }

}

sealed interface SignWithGoogleUseCaseResult {
    data object Success : SignWithGoogleUseCaseResult
    data class ErrorAuth(val errorMessage :String) : SignWithGoogleUseCaseResult

}