package com.example.potiongo.domain

import com.example.potiongo.data.User
import com.example.potiongo.repository.UserRepository
import com.example.potiongo.services.AuthService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class GetUserInfoUseCaseTest {

    private lateinit var userRepository: UserRepository
    private lateinit var authService: AuthService
    private lateinit var useCase: GetUserInfoUseCase

    @Before
    fun setUp() {
        userRepository = mock()
        authService = mock()
        useCase = GetUserInfoUseCase(userRepository, authService)
    }

    @Test
    fun `invoke returns Success when user found`() = runTest {
        val user = User(id = "uid-1", firstName = "Alice", lastName = "Smith")
        whenever(authService.getUid()).thenReturn("uid-1")
        whenever(userRepository.getUserInfo("uid-1")).thenReturn(user)

        val result = useCase()

        assertTrue(result is GetUserInfoUseCaseResult.Success)
        assertEquals("Alice", (result as GetUserInfoUseCaseResult.Success).user.firstName)
    }

    @Test
    fun `invoke returns Error when uid is null`() = runTest {
        whenever(authService.getUid()).thenReturn(null)

        val result = useCase()

        assertTrue(result is GetUserInfoUseCaseResult.Error)
    }

    @Test
    fun `invoke returns Error when user not found in repository`() = runTest {
        whenever(authService.getUid()).thenReturn("uid-1")
        whenever(userRepository.getUserInfo("uid-1")).thenReturn(null)

        val result = useCase()

        assertTrue(result is GetUserInfoUseCaseResult.Error)
    }
}
