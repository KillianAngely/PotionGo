package com.example.potiongo.data

import com.google.android.gms.maps.model.LatLng

data class DirectionsResult(
    val points: List<LatLng>,
    val duration: String,
    val distance: String
)
