package com.example.potiongo.domain

import android.content.Context
import com.example.potiongo.repository.UserRepository
import com.example.potiongo.services.AuthService
import com.example.potiongo.services.CloudFunctionsService
import com.example.potiongo.services.GetGoogleIdTokenCredentialResult
import com.example.potiongo.services.GoogleAuthService
import javax.inject.Inject


class SignWithGoogleUseCase @Inject constructor(
    private val auth: AuthService,
    private val googleAuthService: GoogleAuthService ,
    private val userRepository: UserRepository,
    private val cloudFunctionsService: CloudFunctionsService
)  {
    suspend operator fun invoke(activityContext: Context) : SignWithGoogleUseCaseResult{
        when(val res = googleAuthService.getGoogleIdTokenCredential(activityContext)){
            is GetGoogleIdTokenCredentialResult.Success -> {
                return try {
                    val credential = res.credential
                    val authResult = auth.signInWithCredential(credential)
                    val user = authResult.user
                        ?: return SignWithGoogleUseCaseResult.ErrorAuth("User is null")

                    if (!userRepository.isExist(user.uid)) {
                        cloudFunctionsService.createUser(
                            role = "customer",
                            email = user.email ?: "",
                            firstName = user.displayName?.split(" ")?.firstOrNull() ?: "",
                            lastName = user.displayName?.split(" ")?.lastOrNull() ?: ""
                        )
                    }
                    SignWithGoogleUseCaseResult.Success
                } catch (e: Exception) {
                    SignWithGoogleUseCaseResult.ErrorAuth(e.message ?: "Unknown error")
                }
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