package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Product
import com.example.potiongo.repository.ProductRepository
import javax.inject.Inject

private const val TAG : String = "GetAllProductUseCase"

sealed interface GetAllProductUseCaseResult {
    data class Success(val products : List<Product>) : GetAllProductUseCaseResult
    data object Error : GetAllProductUseCaseResult
}

class GetAllProductUseCase @Inject constructor(
    private val productRepository: ProductRepository
){
    suspend operator fun invoke() : GetAllProductUseCaseResult {
        return try {
            val product = productRepository.getAllProduct()
            Log.d(TAG,"GetAllProductUseCase:success")
            GetAllProductUseCaseResult.Success(product)
        } catch (e : Exception){
            Log.d(TAG,"GetAllProductUseCase:failed",e)
            GetAllProductUseCaseResult.Error
        }
    }
}