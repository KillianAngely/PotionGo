package com.example.potiongo.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.potiongo.MainActivity
import com.example.potiongo.R
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class PotionGoMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "PotionGoFCM"
        const val CHANNEL_ID = "order_notifications"
        private const val ORDER_CHANNEL_NAME = "Commandes"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM token: $token")
        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return
        FirebaseFirestore.getInstance()
            .collection("users")
            .document(uid)
            .update("fcmToken", token)
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to update FCM token", e)
            }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.d(TAG, "Message received: ${message.data}")

        val type = message.data["type"]
        if (type == "NEW_ORDER") {
            showOrderNotification(message)
        }
    }

    private fun showOrderNotification(message: RemoteMessage) {
        createNotificationChannel()

        val orderId = message.data["orderId"] ?: return
        val address = message.data["dropoffAddress"] ?: "Adresse inconnue"
        val itemCount = message.data["itemCount"] ?: "?"
        val dropoffLat = message.data["dropoffLat"] ?: "0.0"
        val dropoffLng = message.data["dropoffLng"] ?: "0.0"

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("orderId", orderId)
            putExtra("dropoffAddress", address)
            putExtra("dropoffLat", dropoffLat)
            putExtra("dropoffLng", dropoffLng)
            putExtra("itemCount", itemCount)
            putExtra("navigateTo", "order_request")
        }
        val pendingIntent = PendingIntent.getActivity(
            this, orderId.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("Nouvelle commande")
            .setContentText("$itemCount article(s) - $address")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(orderId.hashCode(), notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                ORDER_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications de nouvelles commandes"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
