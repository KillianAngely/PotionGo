package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.services.AuthService
import com.example.potiongo.services.CloudFunctionsService
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class SignUpUseCaseTest {

    private lateinit var authService: AuthService
    private lateinit var cloudFunctionsService: CloudFunctionsService
    private lateinit var useCase: SignUpUseCase

    @Before
    fun setUp() {
        authService = mock()
        cloudFunctionsService = mock()
        useCase = SignUpUseCase(authService, cloudFunctionsService)
    }

    @Test
    fun `invoke returns Success when signup succeeds`() = runTest {
        val user: FirebaseUser = mock()
        val authResult: AuthResult = mock()
        whenever(authResult.user).thenReturn(user)
        whenever(authService.signUp("a@b.com", "pass123")).thenReturn(authResult)

        mockStatic(Log::class.java).use {
            val result = useCase("a@b.com", "pass123", "John", "Doe", "customer")

            assertTrue(result is SignUpUseCaseResult.Success)
            verify(authService).sendEmailVerification(user)
            verify(cloudFunctionsService).createUser("customer", "a@b.com", "John", "Doe")
        }
    }

    @Test
    fun `invoke returns ErrorAuth when user is null`() = runTest {
        val authResult: AuthResult = mock()
        whenever(authResult.user).thenReturn(null)
        whenever(authService.signUp("a@b.com", "pass123")).thenReturn(authResult)

        mockStatic(Log::class.java).use {
            val result = useCase("a@b.com", "pass123", "John", "Doe", "customer")

            assertTrue(result is SignUpUseCaseResult.ErrorAuth)
            assertEquals("Unknown user", (result as SignUpUseCaseResult.ErrorAuth).errorMessage)
        }
    }

    @Test
    fun `invoke returns ErrorAuth when exception thrown`() = runTest {
        whenever(authService.signUp("a@b.com", "pass123")).thenThrow(RuntimeException("Email exists"))

        mockStatic(Log::class.java).use {
            val result = useCase("a@b.com", "pass123", "John", "Doe", "customer")

            assertTrue(result is SignUpUseCaseResult.ErrorAuth)
            assertEquals(
                "Unknown error: Email exists",
                (result as SignUpUseCaseResult.ErrorAuth).errorMessage
            )
        }
    }
}
