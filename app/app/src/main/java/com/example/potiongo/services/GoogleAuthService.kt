package com.example.potiongo.services

import android.content.Context
import android.util.Log
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.Companion.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import java.security.SecureRandom
import java.util.Base64
import javax.inject.Inject
import com.example.potiongo.R
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.GoogleAuthProvider
import javax.inject.Singleton


interface IGoogleAuthService {
    suspend fun getGoogleIdTokenCredential(activityContext: Context) : GetGoogleIdTokenCredentialResult
    suspend fun clearCredentials()  //todo idk for now
}


private const val TAG = "GoogleAuthService"

class GoogleAuthService @Inject constructor(
    private val credentialManager: CredentialManager
) : IGoogleAuthService {

    override suspend fun getGoogleIdTokenCredential(activityContext: Context): GetGoogleIdTokenCredentialResult{
        val signInOption = GetSignInWithGoogleOption.Builder(activityContext.getString(R.string.default_web_client_id_google_auth))
            .setNonce(generateNonce())
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(signInOption)
            .build()

        return try {
            val result = credentialManager.getCredential(activityContext, request)
            val credential = result.credential
            Log.d(TAG,credential.type)

            if (credential is CustomCredential && credential.type == TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                Log.d(TAG, "========== CREDENTIAL DATA ==========")
                Log.d(TAG, "displayName: ${googleIdTokenCredential.displayName}")
                Log.d(TAG, "id (email): ${googleIdTokenCredential.id}")
                Log.d(TAG, "givenName: ${googleIdTokenCredential.givenName}")
                Log.d(TAG, "familyName: ${googleIdTokenCredential.familyName}")
                Log.d(TAG, "profilePictureUri: ${googleIdTokenCredential.profilePictureUri}")
                Log.d(TAG, "idToken (first 50 chars): ${googleIdTokenCredential.idToken.take(50)}")
                Log.d(TAG, "=====================================")
                val credential = GoogleAuthProvider.getCredential(googleIdTokenCredential.idToken, null)
                GetGoogleIdTokenCredentialResult.Success(credential)
            } else {
                Log.w(TAG, "Type de credential inattendu")
                GetGoogleIdTokenCredentialResult.Error("Type de credential inattendu")
            }
        } catch (e: GetCredentialCancellationException) {
            Log.d(TAG, "Connexion annulée")
            GetGoogleIdTokenCredentialResult.Error("Connexion annulée")

        } catch (e: GetCredentialException) {
            Log.e(TAG, "Erreur de connexion", e)
            GetGoogleIdTokenCredentialResult.Error("Erreur de connexion")
        }
    }

    override suspend fun clearCredentials(){
        val clearRequest = ClearCredentialStateRequest()
        credentialManager.clearCredentialState(clearRequest)
    }

}

private fun generateNonce(byteLength: Int = 32): String {
    val bytes = ByteArray(byteLength)
    SecureRandom.getInstanceStrong().nextBytes(bytes)
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
}


sealed class GetGoogleIdTokenCredentialResult {
    data class Success(val credential : AuthCredential) : GetGoogleIdTokenCredentialResult()
    data class Error(val error : String) : GetGoogleIdTokenCredentialResult()
}

@Module
@InstallIn(SingletonComponent::class)
object GoogleAuthServiceModule {

    @Provides
    @Singleton
    fun provideCredentialManager(
        @ApplicationContext context: Context
    ): CredentialManager {
        return CredentialManager.create(context)
    }
}
