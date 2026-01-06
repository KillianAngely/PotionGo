package com.example.potiongo.services

import android.util.Log
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.tasks.await

interface IAuthService {
    fun isAuthenticated(): Boolean

    suspend fun signUp(email: String, password: String): Result<Unit>

    suspend fun login(email: String, password: String): Result<Unit>

    suspend fun signOut(): Result<Unit>

    suspend fun signInWithCredential(credential: AuthCredential): Result<Unit>
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

    override suspend fun signOut(): Result<Unit> {
        return try {
            auth.signOut()
            Log.d(TAG, "signOut:success")
            Result.success(Unit)
        }catch (e : Exception){
            Log.d(TAG, "signOut:failure")
            Result.failure(e)
        }
    }

    override suspend fun signInWithCredential(credential: AuthCredential): Result<Unit> {
        try {
            auth.signInWithCredential(credential)
            /*TODO Clear credentials manager see https://firebase.google.com/docs/auth/android/google-signin
            *  */
            Log.d(TAG, "signInWithCredential:succes")
            return Result.success(Unit)
        } catch (e : Exception){
            Log.d(TAG, "signInWithCredential:failure")
            return Result.failure(e)
        }
    }

}