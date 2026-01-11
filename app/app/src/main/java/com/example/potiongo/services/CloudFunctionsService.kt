package com.example.potiongo.services

import android.util.Log
import com.google.firebase.functions.FirebaseFunctions
import kotlinx.coroutines.tasks.await


interface ICloudFunctionsService {
    suspend fun setUserRole(role: String): Result<String>
}

private val TAG : String = "CloudFunctionsService"
class CloudFunctionsService(private val cFunction: FirebaseFunctions) : ICloudFunctionsService {
    override suspend fun setUserRole(role: String): Result<String> {
        return try {
            val data = hashMapOf("role" to role)
            val result = cFunction.getHttpsCallable("setUserRole")
                .call(data)
                .await()
3
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