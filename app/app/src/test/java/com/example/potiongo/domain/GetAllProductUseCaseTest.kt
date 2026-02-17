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

class GetAllProductUseCaseTest {

    private lateinit var productRepository: ProductRepository
    private lateinit var useCase: GetAllProductUseCase

    @Before
    fun setUp() {
        productRepository = mock()
        useCase = GetAllProductUseCase(productRepository)
    }

    @Test
    fun `invoke returns Success with products`() = runTest {
        val products = listOf(
            Product(id = "p1", name = "Potion A", price = 10.0),
            Product(id = "p2", name = "Potion B", price = 20.0)
        )
        whenever(productRepository.getAllProduct()).thenReturn(products)

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetAllProductUseCaseResult.Success)
            assertEquals(2, (result as GetAllProductUseCaseResult.Success).products.size)
        }
    }

    @Test
    fun `invoke returns Success with empty list`() = runTest {
        whenever(productRepository.getAllProduct()).thenReturn(emptyList())

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetAllProductUseCaseResult.Success)
            assertEquals(0, (result as GetAllProductUseCaseResult.Success).products.size)
        }
    }

    @Test
    fun `invoke returns Error when repository throws`() = runTest {
        whenever(productRepository.getAllProduct()).thenThrow(RuntimeException("DB error"))

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetAllProductUseCaseResult.Error)
        }
    }
}
