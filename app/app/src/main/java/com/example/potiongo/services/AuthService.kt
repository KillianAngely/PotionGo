package com.example.potiongo.services

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.tasks.await

interface IAuthService {
    fun isAuthenticated(): Boolean

    suspend fun signUp(email: String, password: String): Result<Unit>

    suspend fun login(email: String, password: String): Result<Unit>
}

private val TAG : String = "AuthService"
class AuthService(private val auth : FirebaseAuth) : IAuthService {


    override fun isAuthenticated() = auth.currentUser != null

    override suspend fun signUp(email: String, password: String): Result<Unit> {
        return try {
            auth.createUserWithEmailAndPassword(email, password).await()
            Log.d(TAG, "createUserWithEmail:success")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.w(TAG, "createUserWithEmail:failure", e)
            Result.failure(e)
        }
    }

    override suspend fun login(email: String, password: String): Result<Unit> {
        return try {
            auth.signInWithEmailAndPassword(email, password)
            Log.d(TAG, "loginUserWithEmail:success")
            Result.success(Unit)

        } catch (e: Exception) {
            Log.w(TAG, "loginUserWithEmail:failure", e)
            Result.failure(e)
        }
    }

}