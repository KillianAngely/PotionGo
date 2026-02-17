package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Role
import com.example.potiongo.services.AuthService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class GetRoleUseCaseTest {

    private lateinit var authService: AuthService
    private lateinit var useCase: GetRoleUseCase

    @Before
    fun setUp() {
        authService = mock()
        useCase = GetRoleUseCase(authService)
    }

    @Test
    fun `invoke returns Customer when role is CUSTOMER`() = runTest {
        whenever(authService.getRole()).thenReturn(Role.CUSTOMER)

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetRoleUseCaseResult.Customer)
        }
    }

    @Test
    fun `invoke returns Driver when role is DRIVER`() = runTest {
        whenever(authService.getRole()).thenReturn(Role.DRIVER)

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetRoleUseCaseResult.Driver)
        }
    }

    @Test
    fun `invoke returns ErrorAuth when exception thrown`() = runTest {
        whenever(authService.getRole()).thenThrow(RuntimeException("Token expired"))

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetRoleUseCaseResult.ErrorAuth)
        }
    }
}
