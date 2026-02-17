package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Product
import com.example.potiongo.repository.ProductRepository
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class GetProductByIdUseCaseTest {

    private lateinit var productRepository: ProductRepository
    private lateinit var useCase: GetProductByIdUseCase

    @Before
    fun setUp() {
        productRepository = mock()
        useCase = GetProductByIdUseCase(productRepository)
    }

    @Test
    fun `invoke returns Success when product found`() = runTest {
        val product = Product(id = "p1", name = "Healing Potion", price = 15.0)
        whenever(productRepository.getProductById("p1")).thenReturn(product)

        mockStatic(Log::class.java).use {
            val result = useCase("p1")

            assertTrue(result is GetProductByIdUseCaseResult.Success)
            assertEquals("Healing Potion", (result as GetProductByIdUseCaseResult.Success).product.name)
        }
    }

    @Test
    fun `invoke returns Error when product not found`() = runTest {
        whenever(productRepository.getProductById("unknown")).thenReturn(null)

        mockStatic(Log::class.java).use {
            val result = useCase("unknown")

            assertTrue(result is GetProductByIdUseCaseResult.Error)
        }
    }

    @Test
    fun `invoke returns Error when repository throws`() = runTest {
        whenever(productRepository.getProductById("p1")).thenThrow(RuntimeException("DB error"))

        mockStatic(Log::class.java).use {
            val result = useCase("p1")

            assertTrue(result is GetProductByIdUseCaseResult.Error)
        }
    }
}
