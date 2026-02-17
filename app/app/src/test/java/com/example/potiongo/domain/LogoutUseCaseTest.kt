package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.AuthService
import com.example.potiongo.services.GoogleAuthService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class LogoutUseCaseTest {

    private lateinit var authService: AuthService
    private lateinit var googleAuthService: GoogleAuthService
    private lateinit var useCase: LogoutUseCase

    @Before
    fun setUp() {
        authService = mock()
        googleAuthService = mock()
        useCase = LogoutUseCase(authService, googleAuthService)
    }

    @Test
    fun `invoke returns Success and calls signOut and clearCredentials`() = runTest {
        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is LogoutUseCaseResult.Success)
            verify(authService).signOut()
            verify(googleAuthService).clearCredentials()
        }
    }

    @Test
    fun `invoke returns ErrorAuth when signOut throws`() = runTest {
        whenever(authService.signOut()).thenThrow(RuntimeException("Sign out failed"))

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is LogoutUseCaseResult.ErrorAuth)
            assertEquals(
                "Unknown error: Sign out failed",
                (result as LogoutUseCaseResult.ErrorAuth).errorMessage
            )
        }
    }
}
