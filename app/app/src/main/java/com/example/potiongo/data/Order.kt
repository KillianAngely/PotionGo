package com.example.potiongo.data



data class Order(
    val id: String = "",
    val customerId: String = "",
    val driverId: String = "",
    val driverStart: OrderLocation = OrderLocation(),
    val dropoff: OrderLocation = OrderLocation(),
    val items: List<OrderItem> = emptyList(),
    val status: String = "PENDING",
    val validationCode: String = "",
    val createdAt: Long = 0L
)
