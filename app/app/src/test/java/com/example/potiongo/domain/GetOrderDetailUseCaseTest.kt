package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Order
import com.example.potiongo.data.OrderItem
import com.example.potiongo.data.Product
import com.example.potiongo.data.User
import com.example.potiongo.repository.OrderRepository
import com.example.potiongo.repository.ProductRepository
import com.example.potiongo.repository.UserRepository
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class GetOrderDetailUseCaseTest {

    private lateinit var orderRepository: OrderRepository
    private lateinit var userRepository: UserRepository
    private lateinit var productRepository: ProductRepository
    private lateinit var useCase: GetOrderDetailUseCase

    @Before
    fun setUp() {
        orderRepository = mock()
        userRepository = mock()
        productRepository = mock()
        useCase = GetOrderDetailUseCase(orderRepository, userRepository, productRepository)
    }

    @Test
    fun `invoke returns Success with full order detail`() = runTest {
        val product = Product(id = "p1", name = "Potion", price = 10.0)
        val order = Order(
            id = "order-1",
            driverId = "driver-1",
            items = listOf(OrderItem(potionId = "p1", quantity = 2))
        )
        val driver = User(id = "driver-1", firstName = "John", lastName = "Doe")

        whenever(orderRepository.getOrderById("order-1")).thenReturn(order)
        whenever(userRepository.getUserInfo("driver-1")).thenReturn(driver)
        whenever(productRepository.getProductById("p1")).thenReturn(product)

        mockStatic(Log::class.java).use {
            val result = useCase("order-1")

            assertTrue(result is GetOrderDetailUseCaseResult.Success)
            val detail = (result as GetOrderDetailUseCaseResult.Success).detail
            assertEquals("order-1", detail.order.id)
            assertEquals("John Doe", detail.driverName)
            assertEquals(1, detail.items.size)
            assertEquals(2, detail.items[0].quantity)
            assertEquals("Potion", detail.items[0].product.name)
        }
    }

    @Test
    fun `invoke returns Success with null driverName when no driver assigned`() = runTest {
        val product = Product(id = "p1", name = "Potion", price = 10.0)
        val order = Order(
            id = "order-2",
            driverId = "",
            items = listOf(OrderItem(potionId = "p1", quantity = 1))
        )

        whenever(orderRepository.getOrderById("order-2")).thenReturn(order)
        whenever(productRepository.getProductById("p1")).thenReturn(product)

        mockStatic(Log::class.java).use {
            val result = useCase("order-2")

            assertTrue(result is GetOrderDetailUseCaseResult.Success)
            val detail = (result as GetOrderDetailUseCaseResult.Success).detail
            assertNull(detail.driverName)
        }
    }

    @Test
    fun `invoke returns Error when order not found`() = runTest {
        whenever(orderRepository.getOrderById("unknown")).thenReturn(null)

        mockStatic(Log::class.java).use {
            val result = useCase("unknown")

            assertTrue(result is GetOrderDetailUseCaseResult.Error)
        }
    }

    @Test
    fun `invoke returns Error when repository throws`() = runTest {
        whenever(orderRepository.getOrderById("order-1")).thenThrow(RuntimeException("DB error"))

        mockStatic(Log::class.java).use {
            val result = useCase("order-1")

            assertTrue(result is GetOrderDetailUseCaseResult.Error)
        }
    }
}
