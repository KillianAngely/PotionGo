package com.example.potiongo.repository

import android.content.Context
import android.content.pm.PackageManager
import com.example.potiongo.data.DirectionsResult
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.PolyUtil
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

interface IDirectionsRepository {
    suspend fun getRoute(
        originLat: Double,
        originLng: Double,
        destLat: Double,
        destLng: Double
    ): DirectionsResult?
}

class DirectionsRepository @Inject constructor(
    @ApplicationContext private val context: Context
) : IDirectionsRepository {

    private val apiKey: String by lazy {
        val appInfo = context.packageManager.getApplicationInfo(
            context.packageName, PackageManager.GET_META_DATA
        )
        appInfo.metaData?.getString("com.google.android.geo.API_KEY") ?: ""
    }

    override suspend fun getRoute(
        originLat: Double,
        originLng: Double,
        destLat: Double,
        destLng: Double
    ): DirectionsResult? = withContext(Dispatchers.IO) {
        try {
            val url = "https://maps.googleapis.com/maps/api/directions/json" +
                "?origin=$originLat,$originLng" +
                "&destination=$destLat,$destLng" +
                "&mode=driving" +
                "&key=$apiKey"

            val response = URL(url).readText()
            val json = JSONObject(response)

            if (json.getString("status") != "OK") return@withContext null

            val route = json.getJSONArray("routes").getJSONObject(0)
            val leg = route.getJSONArray("legs").getJSONObject(0)

            val polyline = route.getJSONObject("overview_polyline").getString("points")
            val points = PolyUtil.decode(polyline)

            val duration = leg.getJSONObject("duration").getString("text")
            val distance = leg.getJSONObject("distance").getString("text")

            DirectionsResult(
                points = points,
                duration = duration,
                distance = distance
            )
        } catch (e: Exception) {
            null
        }
    }
}

@Module
@InstallIn(SingletonComponent::class)
object DirectionsRepositoryModule {

    @Provides
    @Singleton
    fun provideDirectionsRepository(@ApplicationContext context: Context): DirectionsRepository {
        return DirectionsRepository(context)
    }
}
