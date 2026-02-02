package com.example.potiongo.domain

import com.example.potiongo.services.AuthService
import javax.inject.Inject

private const val TAG : String = "EmailVerifUseCase"

sealed interface EmailVerifUseCaseResult {
    data object Success : EmailVerifUseCaseResult
    data object NotVerified : EmailVerifUseCaseResult

}


class EmailVerifUseCase @Inject constructor(
    private val auth: AuthService
){
    suspend operator fun invoke() : EmailVerifUseCaseResult {
        val isEmailVerified: Boolean = auth.getUser().isEmailVerified
        if(isEmailVerified) {
            return EmailVerifUseCaseResult.Success
        }
        return EmailVerifUseCaseResult.NotVerified
    }
}