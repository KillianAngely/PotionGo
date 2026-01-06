package com.example.potiongo.ui.components

import android.content.Context
import android.util.Log
import android.widget.Toast
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.example.potiongo.services.AuthService
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.Companion.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.launch
import java.security.SecureRandom
import java.util.Base64

private const val TAG = "GoogleSignIn"

@Composable
fun ButtonSignInWithGoogle(
    modifier: Modifier = Modifier,
    webClientId: String,
    onSignInResult: (Boolean) -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    OutlinedButton(
        modifier = modifier,
        onClick = {
            scope.launch {
                val success = signInWithGoogle(context, webClientId)
                onSignInResult(success)
            }
        }
    ) {
        Text("Continue With Google")
    }
}

private suspend fun signInWithGoogle(context: Context, webClientId: String): Boolean {
    val credentialManager = CredentialManager.create(context)

    val signInOption = GetSignInWithGoogleOption.Builder(webClientId)
        .setNonce(generateNonce())
        .build()

    val request = GetCredentialRequest.Builder()
        .addCredentialOption(signInOption)
        .build()

    return try {
        val result = credentialManager.getCredential(context, request)
        val credential = result.credential

        if (credential is CustomCredential && credential.type == TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            val idToken = GoogleIdTokenCredential.createFrom(credential.data).idToken
            firebaseAuthWithGoogle(idToken)
            Toast.makeText(context, "Connexion réussie!", Toast.LENGTH_SHORT).show()
            true
        } else {
            Log.w(TAG, "Type de credential inattendu")
            false
        }
    } catch (e: GetCredentialCancellationException) {
        Log.d(TAG, "Connexion annulée")
        false
    } catch (e: GetCredentialException) {
        Log.e(TAG, "Erreur de connexion", e)
        Toast.makeText(context, "Échec de connexion", Toast.LENGTH_SHORT).show()
        false
    }
}

private suspend  fun firebaseAuthWithGoogle(idToken: String) {
    val credential = GoogleAuthProvider.getCredential(idToken, null)
    AuthService(FirebaseAuth.getInstance()).signInWithCredential(credential)
}

private fun generateNonce(byteLength: Int = 32): String {
    val bytes = ByteArray(byteLength)
    SecureRandom.getInstanceStrong().nextBytes(bytes)
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
}