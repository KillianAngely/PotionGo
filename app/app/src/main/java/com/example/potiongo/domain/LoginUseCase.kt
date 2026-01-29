package com.example.potiongo.domain


import android.util.Log
import com.example.potiongo.services.AuthService
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import javax.inject.Inject


private const val TAG : String = "LoginUseCase"

sealed interface LoginUseCaseResult {
    data object Success : LoginUseCaseResult
    data class ErrorAuth(val errorMessage :String) : LoginUseCaseResult

}


class LoginUseCase @Inject constructor(
    private val auth: AuthService
){
    suspend operator fun invoke(email: String, password: String): LoginUseCaseResult {
        return try {
            auth.login(email, password)
            LoginUseCaseResult.Success
        } catch (e: FirebaseAuthInvalidCredentialsException) {
            LoginUseCaseResult.ErrorAuth("Invalid Password")
        } catch (e: Exception) {
            e.printStackTrace()
            LoginUseCaseResult.ErrorAuth("Unknown error: ${e.message}")
        }
    }
}