package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.repository.LocationRepository
import com.example.potiongo.services.AuthService
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class SendLocationUseCaseTest {

    private lateinit var locationRepository: LocationRepository
    private lateinit var authService: AuthService
    private lateinit var useCase: SendLocationUseCase

    @Before
    fun setUp() {
        locationRepository = mock()
        authService = mock()
        useCase = SendLocationUseCase(locationRepository, authService)
    }

    @Test
    fun `invoke returns Success and updates location`() {
        whenever(authService.getUid()).thenReturn("uid-1")

        mockStatic(Log::class.java).use {
            val result = useCase(48.85, 2.35)

            assertTrue(result is SendLocationUseCaseResult.Success)
            verify(locationRepository).updateDriverLocation("uid-1", 48.85, 2.35)
        }
    }

    @Test
    fun `invoke returns Error when user not authenticated`() {
        whenever(authService.getUid()).thenReturn(null)

        val result = useCase(48.85, 2.35)

        assertTrue(result is SendLocationUseCaseResult.Error)
        assertEquals(
            "User not authenticated",
            (result as SendLocationUseCaseResult.Error).errorMessage
        )
    }

    @Test
    fun `invoke returns Error when repository throws`() {
        whenever(authService.getUid()).thenReturn("uid-1")
        whenever(locationRepository.updateDriverLocation("uid-1", 48.85, 2.35))
            .thenThrow(RuntimeException("DB error"))

        mockStatic(Log::class.java).use {
            val result = useCase(48.85, 2.35)

            assertTrue(result is SendLocationUseCaseResult.Error)
            assertEquals("DB error", (result as SendLocationUseCaseResult.Error).errorMessage)
        }
    }
}
