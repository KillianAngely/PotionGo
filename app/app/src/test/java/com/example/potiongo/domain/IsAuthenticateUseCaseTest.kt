package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.AuthService
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class IsAuthenticateUseCaseTest {

    private lateinit var authService: AuthService
    private lateinit var useCase: IsAuthenticateUseCase

    @Before
    fun setUp() {
        authService = mock()
        useCase = IsAuthenticateUseCase(authService)
    }

    @Test
    fun `invoke returns Success true when authenticated`() {
        whenever(authService.isAuthenticated()).thenReturn(true)

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is IsAuthenticateUseCaseResult.Success)
            assertEquals(true, (result as IsAuthenticateUseCaseResult.Success).isAuthenticated)
        }
    }

    @Test
    fun `invoke returns Success false when not authenticated`() {
        whenever(authService.isAuthenticated()).thenReturn(false)

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is IsAuthenticateUseCaseResult.Success)
            assertEquals(false, (result as IsAuthenticateUseCaseResult.Success).isAuthenticated)
        }
    }

    @Test
    fun `invoke returns ErrorAuth when exception thrown`() {
        whenever(authService.isAuthenticated()).thenThrow(RuntimeException("Auth error"))

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is IsAuthenticateUseCaseResult.ErrorAuth)
        }
    }
}
