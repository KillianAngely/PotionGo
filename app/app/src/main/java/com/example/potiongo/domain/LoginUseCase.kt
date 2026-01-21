package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.AuthService
import kotlinx.coroutines.delay
import javax.inject.Inject


private val TAG : String = "LoginUseCase"

sealed interface LoginUseCaseResult {
    data object Success : LoginUseCaseResult
    data object ErrorApi : LoginUseCaseResult

}


class LoginUseCase @Inject constructor(
    private val auth: AuthService
){
    suspend operator fun invoke(email: String, password : String) :LoginUseCaseResult{
        return try {
            auth.login(email, password)
            Log.d(TAG,"login:success")
            LoginUseCaseResult.Success
        } catch (e : Exception) {
            Log.d(TAG,"login:failed",e)
            LoginUseCaseResult.ErrorApi
        }
    }
}