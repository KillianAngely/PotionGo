package com.example.potiongo.repository

import android.content.Context
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ServerValue
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Inject
import javax.inject.Singleton

interface ILocationRepository {
    fun updateDriverLocation(driverId: String, lat: Double, lng: Double)
}

class LocationRepository @Inject constructor(
    private val database: FirebaseDatabase
) : ILocationRepository {

    override fun updateDriverLocation(driverId: String, lat: Double, lng: Double) {
        val locationData = mapOf(
            "lat" to lat,
            "lng" to lng,
            "timestamp" to ServerValue.TIMESTAMP
        )
        database.reference
            .child("drivers")
            .child(driverId)
            .child("location")
            .setValue(locationData)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object LocationRepositoryModule {

    @Provides
    @Singleton
    fun provideFirebaseDatabase(): FirebaseDatabase {
        return FirebaseDatabase.getInstance()
    }

    @Provides
    @Singleton
    fun provideLocationRepository(database: FirebaseDatabase): LocationRepository {
        return LocationRepository(database)
    }

    @Provides
    @Singleton
    fun provideFusedLocationProviderClient(
        @ApplicationContext context: Context
    ): FusedLocationProviderClient {
        return LocationServices.getFusedLocationProviderClient(context)
    }
}
