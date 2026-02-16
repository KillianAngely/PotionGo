package com.example.potiongo.data


data class User(
    val id: String = "",
    val email: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val role: String = "",
    val averageRating: Double = 0.0,
    val totalRatings: Int = 0
)
