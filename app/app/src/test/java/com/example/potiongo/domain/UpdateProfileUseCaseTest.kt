package com.example.potiongo.domain

import com.example.potiongo.services.CloudFunctionsService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class UpdateProfileUseCaseTest {

    private lateinit var cloudFunctionsService: CloudFunctionsService
    private lateinit var useCase: UpdateProfileUseCase

    @Before
    fun setUp() {
        cloudFunctionsService = mock()
        useCase = UpdateProfileUseCase(cloudFunctionsService)
    }

    @Test
    fun `invoke returns Success with emailChanged true`() = runTest {
        whenever(cloudFunctionsService.updateUser("John", "Doe", "new@mail.com"))
            .thenReturn(mapOf("emailChanged" to true))

        val result = useCase("John", "Doe", "new@mail.com")

        assertTrue(result is UpdateProfileUseCaseResult.Success)
        assertEquals(true, (result as UpdateProfileUseCaseResult.Success).emailChanged)
    }

    @Test
    fun `invoke returns Success with emailChanged false when no email`() = runTest {
        whenever(cloudFunctionsService.updateUser("John", "Doe", null))
            .thenReturn(mapOf("emailChanged" to false))

        val result = useCase("John", "Doe", null)

        assertTrue(result is UpdateProfileUseCaseResult.Success)
        assertEquals(false, (result as UpdateProfileUseCaseResult.Success).emailChanged)
    }

    @Test
    fun `invoke returns Success with emailChanged false when key missing`() = runTest {
        whenever(cloudFunctionsService.updateUser("John", "Doe", null))
            .thenReturn(emptyMap())

        val result = useCase("John", "Doe", null)

        assertTrue(result is UpdateProfileUseCaseResult.Success)
        assertEquals(false, (result as UpdateProfileUseCaseResult.Success).emailChanged)
    }

    @Test
    fun `invoke returns Error when cloud function throws`() = runTest {
        whenever(cloudFunctionsService.updateUser("John", "Doe", null))
            .thenThrow(RuntimeException("Server error"))

        val result = useCase("John", "Doe", null)

        assertTrue(result is UpdateProfileUseCaseResult.Error)
        assertEquals("Server error", (result as UpdateProfileUseCaseResult.Error).message)
    }
}
