package com.example.potiongo.repository

import android.util.Log
import com.google.firebase.Firebase
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.firestore
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton


interface IUserRepository {
    suspend fun isExist(id: String) : Boolean
}


private val TAG : String = "UserRepository"
class UserRepository @Inject constructor(private val firestore : FirebaseFirestore) : IUserRepository {

    override suspend fun isExist(id: String): Boolean {
        return try {
            val document = firestore.collection("users").document(id).get().await()
            document.exists()
        } catch (e: Exception) {
            Log.d(TAG, "get failed with ", e)
            false
        }

    }

}



@Module
@InstallIn(SingletonComponent::class)
object UserRepositoryModule {

    @Provides
    @Singleton
    fun provideFirebaseFirestore(): FirebaseFirestore {
        return Firebase.firestore
    }
}



