package com.example.potiongo.domain

import com.example.potiongo.services.AuthService
import javax.inject.Inject

class LoginUserUseCase @Inject constructor(
    private val auth: AuthService
){
    suspend operator fun invoke(email: String, password : String): Result<Unit>{
        return try {
            auth.login(email, password)
            Result.success(Unit)
        } catch (e : Exception) {
            Result.failure(e)
        }
    }
}