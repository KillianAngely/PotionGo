package com.example.potiongo.domain

import com.example.potiongo.services.AuthService
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class EmailVerifUseCaseTest {

    private lateinit var authService: AuthService
    private lateinit var useCase: EmailVerifUseCase

    @Before
    fun setUp() {
        authService = mock()
        useCase = EmailVerifUseCase(authService)
    }

    @Test
    fun `invoke returns Success when email is verified`() = runTest {
        val user: FirebaseUser = mock()
        whenever(user.isEmailVerified).thenReturn(true)
        whenever(authService.getUser()).thenReturn(user)

        val result = useCase()

        assertTrue(result is EmailVerifUseCaseResult.Success)
    }

    @Test
    fun `invoke returns NotVerified when email is not verified`() = runTest {
        val user: FirebaseUser = mock()
        whenever(user.isEmailVerified).thenReturn(false)
        whenever(authService.getUser()).thenReturn(user)

        val result = useCase()

        assertTrue(result is EmailVerifUseCaseResult.NotVerified)
    }
}
