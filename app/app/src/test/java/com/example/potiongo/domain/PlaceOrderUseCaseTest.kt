package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.data.Cart
import com.example.potiongo.data.Product
import com.example.potiongo.repository.CartRepository
import com.example.potiongo.services.CloudFunctionsService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class PlaceOrderUseCaseTest {

    private lateinit var cloudFunctionsService: CloudFunctionsService
    private lateinit var cartRepository: CartRepository
    private lateinit var useCase: PlaceOrderUseCase

    @Before
    fun setUp() {
        cloudFunctionsService = mock()
        cartRepository = mock()
        useCase = PlaceOrderUseCase(cloudFunctionsService, cartRepository)
    }

    @Test
    fun `invoke returns Success and clears cart on successful order`() = runTest {
        val product = Product(id = "p1", name = "Potion", price = 10.0)
        val cartItems = listOf(Cart(product = product, quantity = 2))
        val itemsFlow = MutableStateFlow(cartItems)
        whenever(cartRepository.items).thenReturn(itemsFlow)
        whenever(cloudFunctionsService.createOrder(any(), any())).thenReturn(
            mapOf("orderId" to "order-1", "validationCode" to "123456")
        )

        mockStatic(Log::class.java).use {
            val result = useCase(48.8566, 2.3522, "Paris")

            assertTrue(result is PlaceOrderUseCaseResult.Success)
            val success = result as PlaceOrderUseCaseResult.Success
            assertEquals("order-1", success.orderId)
            assertEquals("123456", success.validationCode)
            verify(cartRepository).clearCart()
        }
    }

    @Test
    fun `invoke returns Error when cart is empty`() = runTest {
        val itemsFlow = MutableStateFlow<List<Cart>>(emptyList())
        whenever(cartRepository.items).thenReturn(itemsFlow)

        val result = useCase(48.8566, 2.3522)

        assertTrue(result is PlaceOrderUseCaseResult.Error)
        assertEquals("Le panier est vide", (result as PlaceOrderUseCaseResult.Error).message)
    }

    @Test
    fun `invoke returns Error when cloud function throws`() = runTest {
        val product = Product(id = "p1", name = "Potion", price = 10.0)
        val cartItems = listOf(Cart(product = product, quantity = 1))
        val itemsFlow = MutableStateFlow(cartItems)
        whenever(cartRepository.items).thenReturn(itemsFlow)
        whenever(cloudFunctionsService.createOrder(any(), any())).thenThrow(RuntimeException("Network error"))

        mockStatic(Log::class.java).use {
            val result = useCase(48.8566, 2.3522)

            assertTrue(result is PlaceOrderUseCaseResult.Error)
            assertEquals("Network error", (result as PlaceOrderUseCaseResult.Error).message)
        }
    }
}
