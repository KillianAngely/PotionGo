package com.example.potiongo.services

import android.nfc.Tag
import android.util.Log
import com.google.android.gms.tasks.Task
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.functions.FirebaseFunctionsException
import com.google.firebase.functions.functions
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton


interface ICloudFunctionsService {
    suspend fun setUserRole(role: String): Result<String>
    suspend fun createUser(role: String, email : String, firstName : String, lastName: String)
}

private val TAG : String = "CloudFunctionsService"
class CloudFunctionsService @Inject constructor(private val cloudFunction: FirebaseFunctions) : ICloudFunctionsService {
    override suspend fun setUserRole(role: String): Result<String> {
        return try {
            val data = hashMapOf("role" to role)
            val result = cloudFunction.getHttpsCallable("setUserRole")
                .call(data)
                .await()
            val response = result.data as Map<String, Any?>
            val assignedRole = response["role"] as String

            Log.d(TAG, "success - role: $assignedRole")
            Result.success(assignedRole)
        } catch (e: Exception) {
            Log.e(TAG, "failed to set role", e)
            Result.failure(e)
        }
    }

    override suspend fun createUser(
        role: String,
        email: String,
        firstName: String,
        lastName: String
    ) {
        val data = hashMapOf(
            "role" to role,
            "email" to email,
            "firstName" to firstName,
            "lastName" to lastName
        )
        cloudFunction.getHttpsCallable("createUser")
            .call(data).addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    val e = task.exception
                    if (e is FirebaseFunctionsException) {
                        Log.d(TAG, "error",e)
                    }
                    Log.d(TAG, "error", e)
                }
                Log.d(TAG, "createUser:success")
            }.await()
    }

}

@Module
@InstallIn(SingletonComponent::class)
object CloudFunctionsModule {

    @Provides
    @Singleton
    fun provideFirebaseCloudFunctions(): FirebaseFunctions {
        return Firebase.functions
    }

    @Provides
    @Singleton
    fun provideCloudFunctionsService(cloudFunctions: FirebaseFunctions): CloudFunctionsService {
        return CloudFunctionsService(cloudFunctions)
    }
}