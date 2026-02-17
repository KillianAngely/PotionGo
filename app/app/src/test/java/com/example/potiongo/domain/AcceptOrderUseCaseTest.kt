package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.CloudFunctionsService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class AcceptOrderUseCaseTest {

    private lateinit var cloudFunctionsService: CloudFunctionsService
    private lateinit var useCase: AcceptOrderUseCase

    @Before
    fun setUp() {
        cloudFunctionsService = mock()
        useCase = AcceptOrderUseCase(cloudFunctionsService)
    }

    @Test
    fun `invoke returns Success when acceptOrder succeeds`() = runTest {
        val orderId = "order-123"

        val result = useCase(orderId)

        assertTrue(result is AcceptOrderUseCaseResult.Success)
        verify(cloudFunctionsService).acceptOrder(orderId)
    }

    @Test
    fun `invoke returns Error with exception message when acceptOrder fails`() = runTest {
        val orderId = "order-456"
        val errorMessage = "Network error"

        whenever(cloudFunctionsService.acceptOrder(orderId))
            .thenThrow(RuntimeException(errorMessage))

        mockStatic(Log::class.java).use {
            val result = useCase(orderId)

            assertTrue(result is AcceptOrderUseCaseResult.Error)
            assertEquals(errorMessage, (result as AcceptOrderUseCaseResult.Error).message)
        }
    }

    @Test
    fun `invoke returns Error with default message when exception has no message`() = runTest {
        val orderId = "order-789"

        whenever(cloudFunctionsService.acceptOrder(orderId))
            .thenThrow(RuntimeException())

        mockStatic(Log::class.java).use {
            val result = useCase(orderId)

            assertTrue(result is AcceptOrderUseCaseResult.Error)
            assertEquals("Erreur inconnue", (result as AcceptOrderUseCaseResult.Error).message)
        }
    }
}
