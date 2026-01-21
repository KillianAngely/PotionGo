package com.example.potiongo.services

import android.util.Log
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

interface IAuthService {
    fun isAuthenticated(): Boolean

    suspend fun  signUp(email: String, password: String): Result<Unit>

    suspend fun login(email: String, password: String): AuthResult

    suspend fun signOut(): Result<Unit>

    suspend fun signInWithCredential(credential: AuthCredential): Result<Unit>
}

private val TAG : String = "AuthService"
class AuthService @Inject constructor(private val auth : FirebaseAuth) : IAuthService {


    override fun isAuthenticated() = auth.currentUser != null

    override suspend fun signUp(email: String, password: String): Result<Unit> {
        Log.d(TAG, "signUp: START")
        return try {
            Log.d(TAG, "signUp: calling Firebase...")
            val result = auth.createUserWithEmailAndPassword(email, password).await()
            this.sendEmailVerification()
            Log.d(TAG, "signUp: SUCCESS uid=${result.user?.uid}")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "signUp: FAILED", e)
            Result.failure(e)
        }
    }

    override suspend fun login(email: String, password: String): AuthResult {
        return auth.signInWithEmailAndPassword(email, password).await()
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
        Log.d(TAG,"start sendEmailVerification")
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

@Module
@InstallIn(SingletonComponent::class)
object AuthServiceModule {

    @Provides
    @Singleton
    fun provideFirebaseAuth(): FirebaseAuth {
        return FirebaseAuth.getInstance()
    }

    @Provides
    @Singleton
    fun provideAuthService(firebaseAuth: FirebaseAuth): AuthService {
        return AuthService(firebaseAuth)
    }
}