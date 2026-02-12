package com.example.potiongo.repository

import com.example.potiongo.data.Product
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

interface IProductRepository{
    suspend fun getAllProduct(): List<Product>
    suspend fun getProductById(id: String): Product?
}


class ProductRepository @Inject constructor(private val firestore : FirebaseFirestore) : IProductRepository {
    override suspend fun getAllProduct(): List<Product> {
            val snapshot = firestore.collection("products").get().await()
            return snapshot.documents.map { doc ->
                doc.toObject(Product::class.java)!!.copy(id = doc.id)
            }
    }

    override suspend fun getProductById(id: String): Product? {
        val snapshot = firestore.collection("products").document(id).get().await()
        return snapshot.toObject(Product::class.java)?.copy(id = snapshot.id)
    }
}

