package com.example.potiongo.data

data class OrderLocation(
    val address: String = "",
    val lat: Double = 0.0,
    val lng: Double = 0.0
)

data class OrderItem(
    val potionId: String = "",
    val quantity: Int = 0
)

data class Order(
    val customerId: String = "",
    val driverId: String = "",
    val driverStart: OrderLocation = OrderLocation(),
    val dropoff: OrderLocation = OrderLocation(),
    val items: List<OrderItem> = emptyList(),
    val status: String = "PENDING"
)
