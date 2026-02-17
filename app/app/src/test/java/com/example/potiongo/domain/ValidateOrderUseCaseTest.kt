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

class ValidateOrderUseCaseTest {

    private lateinit var cloudFunctionsService: CloudFunctionsService
    private lateinit var useCase: ValidateOrderUseCase

    @Before
    fun setUp() {
        cloudFunctionsService = mock()
        useCase = ValidateOrderUseCase(cloudFunctionsService)
    }

    @Test
    fun `invoke returns Success when validation succeeds`() = runTest {
        val result = useCase("order-1", "123456")

        assertTrue(result is ValidateOrderUseCaseResult.Success)
        verify(cloudFunctionsService).validateOrder("order-1", "123456")
    }

    @Test
    fun `invoke returns Error with message when validation fails`() = runTest {
        whenever(cloudFunctionsService.validateOrder("order-1", "wrong"))
            .thenThrow(RuntimeException("Invalid code"))

        mockStatic(Log::class.java).use {
            val result = useCase("order-1", "wrong")

            assertTrue(result is ValidateOrderUseCaseResult.Error)
            assertEquals("Invalid code", (result as ValidateOrderUseCaseResult.Error).message)
        }
    }

    @Test
    fun `invoke returns Error with default message when exception has no message`() = runTest {
        whenever(cloudFunctionsService.validateOrder("order-1", "wrong"))
            .thenThrow(RuntimeException())

        mockStatic(Log::class.java).use {
            val result = useCase("order-1", "wrong")

            assertTrue(result is ValidateOrderUseCaseResult.Error)
            assertEquals("Code incorrect", (result as ValidateOrderUseCaseResult.Error).message)
        }
    }
}
