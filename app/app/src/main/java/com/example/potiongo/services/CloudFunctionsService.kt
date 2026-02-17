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
    suspend fun createUser(role: String, email: String, firstName: String, lastName: String)
    suspend fun createOrder(items: List<Map<String, Any>>, dropoff: Map<String, Any>): Map<String, Any>
    suspend fun acceptOrder(orderId: String)
    suspend fun validateOrder(orderId: String, validationCode: String)
    suspend fun updateUser(firstName: String, lastName: String, email: String?): Map<String, Any>
    suspend fun submitRating(orderId: String, rating: Int, comment: String?)
}

private const val TAG : String = "CloudFunctionsService"
class CloudFunctionsService @Inject constructor(private val cloudFunction: FirebaseFunctions) : ICloudFunctionsService {

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

    @Suppress("UNCHECKED_CAST")
    override suspend fun createOrder(
        items: List<Map<String, Any>>,
        dropoff: Map<String, Any>
    ): Map<String, Any> {
        val data = hashMapOf(
            "items" to items,
            "dropoff" to dropoff
        )
        val result = cloudFunction.getHttpsCallable("createOrder")
            .call(data).await()
        return result.data as Map<String, Any>
    }

    override suspend fun acceptOrder(orderId: String) {
        val data = hashMapOf("orderId" to orderId)
        cloudFunction.getHttpsCallable("acceptOrder")
            .call(data).await()
    }

    override suspend fun validateOrder(orderId: String, validationCode: String) {
        val data = hashMapOf(
            "orderId" to orderId,
            "validationCode" to validationCode
        )
        cloudFunction.getHttpsCallable("validateOrder")
            .call(data).await()
    }

    override suspend fun submitRating(orderId: String, rating: Int, comment: String?) {
        val data = hashMapOf<String, Any>(
            "orderId" to orderId,
            "rating" to rating
        )
        if (comment != null) {
            data["comment"] = comment
        }
        cloudFunction.getHttpsCallable("submitRating")
            .call(data).await()
    }

    @Suppress("UNCHECKED_CAST")
    override suspend fun updateUser(firstName: String, lastName: String, email: String?): Map<String, Any> {
        val data = hashMapOf<String, Any>(
            "firstName" to firstName,
            "lastName" to lastName
        )
        if (email != null) {
            data["email"] = email
        }
        val result = cloudFunction.getHttpsCallable("updateUser")
            .call(data).await()
        return result.data as Map<String, Any>
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