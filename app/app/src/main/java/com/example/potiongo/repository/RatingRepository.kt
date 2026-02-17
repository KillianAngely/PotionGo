package com.example.potiongo.repository

import android.util.Log
import com.example.potiongo.data.Rating
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

interface IRatingRepository {
    suspend fun getRatingsForUser(userId: String): List<Rating>
    suspend fun hasRatedOrder(orderId: String, reviewerId: String): Boolean
}

private const val TAG = "RatingRepository"

class RatingRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) : IRatingRepository {

    override suspend fun getRatingsForUser(userId: String): List<Rating> {
        return try {
            val snapshot = firestore.collection("ratings")
                .whereEqualTo("revieweeId", userId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()
            snapshot.documents.mapNotNull { doc ->
                doc.toObject(Rating::class.java)?.copy(id = doc.id)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting ratings for user", e)
            emptyList()
        }
    }

    override suspend fun hasRatedOrder(orderId: String, reviewerId: String): Boolean {
        return try {
            val snapshot = firestore.collection("ratings")
                .whereEqualTo("orderId", orderId)
                .whereEqualTo("reviewerId", reviewerId)
                .limit(1)
                .get()
                .await()
            !snapshot.isEmpty
        } catch (e: Exception) {
            Log.e(TAG, "Error checking rated order", e)
            false
        }
    }
}

@Module
@InstallIn(SingletonComponent::class)
object RatingRepositoryModule {

    @Provides
    @Singleton
    fun provideRatingRepository(firestore: FirebaseFirestore): RatingRepository {
        return RatingRepository(firestore)
    }
}
