package com.example.potiongo.services

import android.util.Log
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.actionCodeSettings
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
            //TODO should be extract
            Result.success(Unit)
        } catch (e: Exception) {
            Log.w(TAG, "createUserWithEmail:failure", e)
            Result.failure(e)
        }
    }

    override suspend fun login(email: String, password: String): Result<Unit> {
        return try {
            auth.signInWithEmailAndPassword(email, password)
            this.sendEmailVerification()
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
            /*TODO Clear credentials manager see https://firebase.google.com/docs/auth/android/google-signin
           *  */
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
            Log.d(TAG, "signInWithCredential:succes")
            return Result.success(Unit)
        } catch (e : Exception){
            Log.d(TAG, "signInWithCredential:failure")
            return Result.failure(e)
        }
    }

    private fun sendEmailVerification(): Result<Unit>{
        return try {
            auth.currentUser!!.sendEmailVerification()
            Log.d(TAG, "sendEmailVerification:success")
            Result.success(Unit)
        }catch (e : Exception){
            Log.d(TAG, "sendEmailVerification:failure")
            Result.failure(e)
        }
    }

}