package com.example.potiongo.domain

import android.content.Context
import com.example.potiongo.repository.UserRepository
import com.example.potiongo.services.AuthService
import com.example.potiongo.services.CloudFunctionsService
import com.example.potiongo.services.GetGoogleIdTokenCredentialResult
import com.example.potiongo.services.GoogleAuthService
import com.google.firebase.auth.AuthCredential
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class SignWithGoogleUseCaseTest {

    private lateinit var authService: AuthService
    private lateinit var googleAuthService: GoogleAuthService
    private lateinit var userRepository: UserRepository
    private lateinit var cloudFunctionsService: CloudFunctionsService
    private lateinit var useCase: SignWithGoogleUseCase
    private lateinit var context: Context

    @Before
    fun setUp() {
        authService = mock()
        googleAuthService = mock()
        userRepository = mock()
        cloudFunctionsService = mock()
        context = mock()
        useCase = SignWithGoogleUseCase(authService, googleAuthService, userRepository, cloudFunctionsService)
    }

    @Test
    fun `invoke returns Success for existing user`() = runTest {
        val credential: AuthCredential = mock()
        val firebaseUser: FirebaseUser = mock()
        val authResult: AuthResult = mock()

        whenever(googleAuthService.getGoogleIdTokenCredential(context))
            .thenReturn(GetGoogleIdTokenCredentialResult.Success(credential))
        whenever(authService.signInWithCredential(credential)).thenReturn(authResult)
        whenever(authResult.user).thenReturn(firebaseUser)
        whenever(firebaseUser.uid).thenReturn("uid-1")
        whenever(userRepository.isExist("uid-1")).thenReturn(true)

        val result = useCase(context)

        assertTrue(result is SignWithGoogleUseCaseResult.Success)
        verify(cloudFunctionsService, never()).createUser(any(), any(), any(), any())
    }

    @Test
    fun `invoke returns Success and creates user for new user`() = runTest {
        val credential: AuthCredential = mock()
        val firebaseUser: FirebaseUser = mock()
        val authResult: AuthResult = mock()

        whenever(googleAuthService.getGoogleIdTokenCredential(context))
            .thenReturn(GetGoogleIdTokenCredentialResult.Success(credential))
        whenever(authService.signInWithCredential(credential)).thenReturn(authResult)
        whenever(authResult.user).thenReturn(firebaseUser)
        whenever(firebaseUser.uid).thenReturn("uid-2")
        whenever(firebaseUser.email).thenReturn("test@gmail.com")
        whenever(firebaseUser.displayName).thenReturn("Jane Doe")
        whenever(userRepository.isExist("uid-2")).thenReturn(false)

        val result = useCase(context)

        assertTrue(result is SignWithGoogleUseCaseResult.Success)
        verify(cloudFunctionsService).createUser("customer", "test@gmail.com", "Jane", "Doe")
    }

    @Test
    fun `invoke returns ErrorAuth when user is null`() = runTest {
        val credential: AuthCredential = mock()
        val authResult: AuthResult = mock()

        whenever(googleAuthService.getGoogleIdTokenCredential(context))
            .thenReturn(GetGoogleIdTokenCredentialResult.Success(credential))
        whenever(authService.signInWithCredential(credential)).thenReturn(authResult)
        whenever(authResult.user).thenReturn(null)

        val result = useCase(context)

        assertTrue(result is SignWithGoogleUseCaseResult.ErrorAuth)
        assertEquals("User is null", (result as SignWithGoogleUseCaseResult.ErrorAuth).errorMessage)
    }

    @Test
    fun `invoke returns ErrorAuth when google credential fails`() = runTest {
        whenever(googleAuthService.getGoogleIdTokenCredential(context))
            .thenReturn(GetGoogleIdTokenCredentialResult.Error("cancelled"))

        val result = useCase(context)

        assertTrue(result is SignWithGoogleUseCaseResult.ErrorAuth)
        assertEquals("error usecase", (result as SignWithGoogleUseCaseResult.ErrorAuth).errorMessage)
    }
}
