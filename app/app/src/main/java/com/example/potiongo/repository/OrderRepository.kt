package com.example.potiongo.repository

import com.example.potiongo.data.Order
import com.google.firebase.firestore.FirebaseFirestore
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

interface IOrderRepository {
    suspend fun placeOrder(order: Order): String
    suspend fun getUnassignedOrders(): List<Order>
}

class OrderRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) : IOrderRepository {

    override suspend fun placeOrder(order: Order): String {
        val docRef = firestore.collection("orders").add(order).await()
        return docRef.id
    }

    override suspend fun getUnassignedOrders(): List<Order> {
        val snapshot = firestore.collection("orders")
            .whereEqualTo("driverId", "")
            .get()
            .await()
        return snapshot.toObjects(Order::class.java)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object OrderRepositoryModule {

    @Provides
    @Singleton
    fun provideOrderRepository(firestore: FirebaseFirestore): OrderRepository {
        return OrderRepository(firestore)
    }
}
