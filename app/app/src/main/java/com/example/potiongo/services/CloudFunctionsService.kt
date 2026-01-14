package com.example.potiongo.services

import android.util.Log
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctions
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