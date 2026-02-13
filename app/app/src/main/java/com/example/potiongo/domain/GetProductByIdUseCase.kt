package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Product
import com.example.potiongo.repository.ProductRepository
import javax.inject.Inject

private const val TAG: String = "GetProductByIdUseCase"

sealed interface GetProductByIdUseCaseResult {
    data class Success(val product: Product) : GetProductByIdUseCaseResult
    data object Error : GetProductByIdUseCaseResult
}

class GetProductByIdUseCase @Inject constructor(
    private val productRepository: ProductRepository
) {
    suspend operator fun invoke(id: String): GetProductByIdUseCaseResult {
        return try {
            val product = productRepository.getProductById(id)
            if (product != null) {
                Log.d(TAG, "GetProductByIdUseCase:success")
                GetProductByIdUseCaseResult.Success(product)
            } else {
                Log.d(TAG, "GetProductByIdUseCase:product not found")
                GetProductByIdUseCaseResult.Error
            }
        } catch (e: Exception) {
            Log.d(TAG, "GetProductByIdUseCase:failed", e)
            GetProductByIdUseCaseResult.Error
        }
    }
}
