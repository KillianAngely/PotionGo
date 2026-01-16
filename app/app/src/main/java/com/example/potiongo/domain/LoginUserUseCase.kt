package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.AuthService
import javax.inject.Inject


private val TAG : String = "LoginUserUseCase"
class LoginUserUseCase @Inject constructor(
    private val auth: AuthService
){
    suspend operator fun invoke(email: String, password : String): Result<Unit>{
        return try {
            auth.login(email, password)
            Log.d(TAG,"login:success")
            Result.success(Unit)
        } catch (e : Exception) {
            Log.d(TAG,"login:failed",e)
            Result.failure(e)
        }
    }
}