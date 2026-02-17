package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.AuthService
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class LoginUseCaseTest {

    private lateinit var authService: AuthService
    private lateinit var useCase: LoginUseCase

    @Before
    fun setUp() {
        authService = mock()
        useCase = LoginUseCase(authService)
    }

    @Test
    fun `invoke returns Success when login succeeds`() = runTest {
        val authResult: AuthResult = mock()
        whenever(authService.login("test@mail.com", "pass123")).thenReturn(authResult)

        mockStatic(Log::class.java).use {
            val result = useCase("test@mail.com", "pass123")

            assertTrue(result is LoginUseCaseResult.Success)
        }
    }

    @Test
    fun `invoke returns ErrorAuth with Invalid Password on invalid credentials`() = runTest {
        doAnswer { throw FirebaseAuthInvalidCredentialsException("ERROR_WRONG_PASSWORD", "Invalid Password") }
            .whenever(authService).login("test@mail.com", "wrong")

        mockStatic(Log::class.java).use {
            val result = useCase("test@mail.com", "wrong")

            assertTrue(result is LoginUseCaseResult.ErrorAuth)
        }
    }

    @Test
    fun `invoke returns ErrorAuth with message on generic exception`() = runTest {
        whenever(authService.login("test@mail.com", "pass")).thenThrow(RuntimeException("Network"))

        mockStatic(Log::class.java).use {
            val result = useCase("test@mail.com", "pass")

            assertTrue(result is LoginUseCaseResult.ErrorAuth)
            assertEquals("Unknown error: Network", (result as LoginUseCaseResult.ErrorAuth).errorMessage)
        }
    }
}
