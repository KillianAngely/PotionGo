package com.example.potiongo.data

import com.google.firebase.Timestamp

data class Rating(
    val id: String = "",
    val orderId: String = "",
    val reviewerId: String = "",
    val reviewerRole: String = "",
    val revieweeId: String = "",
    val revieweeRole: String = "",
    val rating: Int = 0,
    val comment: String? = null,
    val createdAt: Timestamp? = null
)
