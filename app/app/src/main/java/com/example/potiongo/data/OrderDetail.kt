package com.example.potiongo.data

data class OrderDetail(
    val order: Order,
    val driverName: String?,
    val items: List<OrderDetailItem>
)

data class OrderDetailItem(
    val product: Product,
    val quantity: Int
)
