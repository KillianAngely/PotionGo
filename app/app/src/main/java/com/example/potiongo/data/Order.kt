package com.example.potiongo.data
import com.google.firebase.Timestamp



data class Order(
    val id: String = "",
    val customerId: String = "",
    val driverId: String? = "",
    val driverStart: OrderLocation? = null,
    val driverEnd: OrderLocation? = null,
    val pickup: OrderLocation = OrderLocation(),
    val dropoff: OrderLocation = OrderLocation(),
    val items: List<OrderItem> = emptyList(),
    val status: String = "PENDING",
    val validationCode: String = "",
    val rejectedBy: List<String> = emptyList(),
    val createdAt: Timestamp? = null,
    val deliveredAt: Timestamp? = null
)
