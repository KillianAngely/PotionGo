package com.example.potiongo.services

import android.util.Log
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseUser
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

interface IAuthService {
    fun isAuthenticated(): Boolean

    suspend fun  signUp(email: String, password: String) : AuthResult

    suspend fun login(email: String, password: String): AuthResult

    fun signOut(): Unit

    suspend fun sendEmailVerification(user: FirebaseUser)

    suspend fun signInWithCredential(credential: AuthCredential): AuthResult
}

private val TAG : String = "AuthService"
class AuthService @Inject constructor(private val auth : FirebaseAuth) : IAuthService {


    override fun isAuthenticated() = auth.currentUser != null

    fun currentUser(){
        auth.currentUser?.providerData?.forEach { profile ->
            Log.d(TAG, "--- Provider ---")
            Log.d(TAG, "providerId: ${profile.providerId}")
            Log.d(TAG, "displayName: ${profile.displayName}")
            Log.d(TAG, "email: ${profile.email}")
            Log.d(TAG, "photoUrl: ${profile.photoUrl}")
        }
        Log.d(TAG, "currentUser: ${auth.currentUser}")
        Log.d(TAG, "currentUser: ${auth.currentUser}")
        Log.d(TAG, "uid: ${auth.currentUser?.uid}")
        Log.d(TAG, "isAnonymous: ${auth.currentUser?.isAnonymous}")
        Log.d(TAG, "providerData: ${auth.currentUser?.providerData}")
    }

    override suspend fun signUp(email: String, password: String): AuthResult {
        return auth.createUserWithEmailAndPassword(email, password).await()
    }

    override suspend fun login(email: String, password: String): AuthResult {
        return auth.signInWithEmailAndPassword(email, password).await()
    }



    override fun signOut(): Unit {
        return auth.signOut()
        /*TODO Clear credentials manager see https://firebase.google.com/docs/auth/android/google-signin
           *  */
    }

    override suspend fun signInWithCredential(credential: AuthCredential): AuthResult  {
        return auth.signInWithCredential(credential).await()
    }

    override suspend fun sendEmailVerification(user: FirebaseUser) {
        user.sendEmailVerification().await()
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