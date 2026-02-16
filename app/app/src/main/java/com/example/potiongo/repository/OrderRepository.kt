package com.example.potiongo.repository

import com.example.potiongo.data.Order
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
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
    suspend fun getOrdersByCustomerId(customerId: String): List<Order>
    suspend fun getOrdersByDriverId(driverId: String): List<Order>
    suspend fun getOrderById(orderId: String): Order?
    suspend fun getActiveOrderForCustomer(customerId: String): Order?
    suspend fun getActiveOrderForDriver(driverId: String): Order?
    fun listenToOrderStatus(orderId: String, onUpdate: (String) -> Unit): ListenerRegistration
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
            .whereEqualTo("status", "PENDING")
            .get()
            .await()
        return snapshot.documents.map { doc ->
            doc.toObject(Order::class.java)!!.copy(id = doc.id)
        }
    }

    override suspend fun getOrdersByCustomerId(customerId: String): List<Order> {
        val snapshot = firestore.collection("orders")
            .whereEqualTo("customerId", customerId)
            .whereEqualTo("status", "DELIVERED")
            .get()
            .await()
        return snapshot.documents.map { doc ->
            doc.toObject(Order::class.java)!!.copy(id = doc.id)
        }
    }

    override suspend fun getOrdersByDriverId(driverId: String): List<Order> {
        val snapshot = firestore.collection("orders")
            .whereEqualTo("driverId", driverId)
            .whereEqualTo("status", "DELIVERED")
            .get()
            .await()
        return snapshot.documents.map { doc ->
            doc.toObject(Order::class.java)!!.copy(id = doc.id)
        }
    }

    override suspend fun getOrderById(orderId: String): Order? {
        val snapshot = firestore.collection("orders").document(orderId).get().await()
        return snapshot.toObject(Order::class.java)?.copy(id = snapshot.id)
    }

    override suspend fun getActiveOrderForCustomer(customerId: String): Order? {
        val snapshot = firestore.collection("orders")
            .whereEqualTo("customerId", customerId)
            .whereEqualTo("status", "ASSIGNED")
            .limit(1)
            .get()
            .await()
        return snapshot.documents.firstOrNull()?.let { doc ->
            doc.toObject(Order::class.java)?.copy(id = doc.id)
        }
    }

    override suspend fun getActiveOrderForDriver(driverId: String): Order? {
        val snapshot = firestore.collection("orders")
            .whereEqualTo("driverId", driverId)
            .whereEqualTo("status", "ASSIGNED")
            .limit(1)
            .get()
            .await()
        return snapshot.documents.firstOrNull()?.let { doc ->
            doc.toObject(Order::class.java)?.copy(id = doc.id)
        }
    }

    override fun listenToOrderStatus(orderId: String, onUpdate: (String) -> Unit): ListenerRegistration {
        return firestore.collection("orders").document(orderId)
            .addSnapshotListener { snapshot, _ ->
                val status = snapshot?.getString("status") ?: return@addSnapshotListener
                onUpdate(status)
            }
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
