package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.repository.FcmTokenRepository
import com.example.potiongo.services.AuthService
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class SaveFcmTokenUseCaseTest {

    private lateinit var fcmTokenRepository: FcmTokenRepository
    private lateinit var authService: AuthService
    private lateinit var useCase: SaveFcmTokenUseCase

    @Before
    fun setUp() {
        fcmTokenRepository = mock()
        authService = mock()
        useCase = SaveFcmTokenUseCase(fcmTokenRepository, authService)
    }

    @Test
    fun `invoke saves token when user is authenticated`() = runTest {
        whenever(authService.getUid()).thenReturn("uid-1")

        mockStatic(Log::class.java).use {
            useCase()

            verify(fcmTokenRepository).saveTokenToFirestore("uid-1")
        }
    }

    @Test
    fun `invoke does nothing when uid is null`() = runTest {
        whenever(authService.getUid()).thenReturn(null)

        useCase()

        verify(fcmTokenRepository, never()).saveTokenToFirestore(org.mockito.kotlin.any())
    }

    @Test
    fun `invoke does not throw when repository fails`() = runTest {
        whenever(authService.getUid()).thenReturn("uid-1")
        whenever(fcmTokenRepository.saveTokenToFirestore("uid-1")).thenThrow(RuntimeException("fail"))

        mockStatic(Log::class.java).use {
            useCase() // should not throw
        }
    }
}
