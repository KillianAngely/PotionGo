package com.example.potiongo.domain

import com.example.potiongo.services.CloudFunctionsService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class SubmitRatingUseCaseTest {

    private lateinit var cloudFunctionsService: CloudFunctionsService
    private lateinit var useCase: SubmitRatingUseCase

    @Before
    fun setUp() {
        cloudFunctionsService = mock()
        useCase = SubmitRatingUseCase(cloudFunctionsService)
    }

    @Test
    fun `invoke returns Success when rating submitted`() = runTest {
        val result = useCase("order-1", 5, "Great!")

        assertTrue(result is SubmitRatingUseCaseResult.Success)
        verify(cloudFunctionsService).submitRating("order-1", 5, "Great!")
    }

    @Test
    fun `invoke returns Success with null comment`() = runTest {
        val result = useCase("order-1", 4, null)

        assertTrue(result is SubmitRatingUseCaseResult.Success)
        verify(cloudFunctionsService).submitRating("order-1", 4, null)
    }

    @Test
    fun `invoke returns Error when cloud function throws`() = runTest {
        whenever(cloudFunctionsService.submitRating("order-1", 5, null))
            .thenThrow(RuntimeException("Network error"))

        val result = useCase("order-1", 5, null)

        assertTrue(result is SubmitRatingUseCaseResult.Error)
        assertEquals("Network error", (result as SubmitRatingUseCaseResult.Error).message)
    }
}
