package com.example.potiongo.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessaging
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

interface IFcmTokenRepository {
    suspend fun getToken(): String
    suspend fun saveTokenToFirestore(uid: String)
}

class FcmTokenRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val messaging: FirebaseMessaging
) : IFcmTokenRepository {

    override suspend fun getToken(): String {
        return messaging.token.await()
    }

    override suspend fun saveTokenToFirestore(uid: String) {
        val token = getToken()
        firestore.collection("users")
            .document(uid)
            .update("fcmToken", token)
            .await()
    }
}

@Module
@InstallIn(SingletonComponent::class)
object FcmTokenModule {

    @Provides
    @Singleton
    fun provideFirebaseMessaging(): FirebaseMessaging {
        return FirebaseMessaging.getInstance()
    }

    @Provides
    @Singleton
    fun provideFcmTokenRepository(
        firestore: FirebaseFirestore,
        messaging: FirebaseMessaging
    ): FcmTokenRepository {
        return FcmTokenRepository(firestore, messaging)
    }
}
