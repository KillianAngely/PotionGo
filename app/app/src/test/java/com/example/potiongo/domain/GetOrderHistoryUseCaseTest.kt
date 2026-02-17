package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Order
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.services.AuthService
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class GetOrderHistoryUseCaseTest {

    private lateinit var orderRepository: OrderRepository
    private lateinit var authService: AuthService
    private lateinit var getRoleUseCase: GetRoleUseCase
    private lateinit var useCase: GetOrderHistoryUseCase

    @Before
    fun setUp() {
        orderRepository = mock()
        authService = mock()
        getRoleUseCase = mock()
        useCase = GetOrderHistoryUseCase(orderRepository, authService, getRoleUseCase)
    }

    @Test
    fun `invoke returns Success with customer orders`() = runTest {
        val orders = listOf(Order(id = "o1"), Order(id = "o2"))
        whenever(authService.getUid()).thenReturn("uid-1")
        whenever(getRoleUseCase.invoke()).thenReturn(GetRoleUseCaseResult.Customer)
        whenever(orderRepository.getOrdersByCustomerId("uid-1")).thenReturn(orders)

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetOrderHistoryUseCaseResult.Success)
            assertEquals(2, (result as GetOrderHistoryUseCaseResult.Success).orders.size)
        }
    }

    @Test
    fun `invoke returns Success with driver orders`() = runTest {
        val orders = listOf(Order(id = "o1"))
        whenever(authService.getUid()).thenReturn("uid-2")
        whenever(getRoleUseCase.invoke()).thenReturn(GetRoleUseCaseResult.Driver)
        whenever(orderRepository.getOrdersByDriverId("uid-2")).thenReturn(orders)

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetOrderHistoryUseCaseResult.Success)
            assertEquals(1, (result as GetOrderHistoryUseCaseResult.Success).orders.size)
        }
    }

    @Test
    fun `invoke returns Error when user not authenticated`() = runTest {
        whenever(authService.getUid()).thenReturn(null)

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetOrderHistoryUseCaseResult.Error)
        }
    }

    @Test
    fun `invoke returns Error when role is ErrorAuth`() = runTest {
        whenever(authService.getUid()).thenReturn("uid-1")
        whenever(getRoleUseCase.invoke()).thenReturn(GetRoleUseCaseResult.ErrorAuth("no role"))

        mockStatic(Log::class.java).use {
            val result = useCase()

            assertTrue(result is GetOrderHistoryUseCaseResult.Error)
        }
    }
}
