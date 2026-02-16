package com.example.potiongo.domain

import android.util.Log
import com.example.potiongo.repository.FcmTokenRepository
import com.example.potiongo.services.AuthService
import javax.inject.Inject

class SaveFcmTokenUseCase @Inject constructor(
    private val fcmTokenRepository: FcmTokenRepository,
    private val authService: AuthService
) {
    suspend operator fun invoke() {
        try {
            val uid = authService.getUid() ?: return
            fcmTokenRepository.saveTokenToFirestore(uid)
            Log.d("SaveFcmTokenUseCase", "FCM token saved for user $uid")
        } catch (e: Exception) {
            Log.e("SaveFcmTokenUseCase", "Failed to save FCM token", e)
        }
    }
}
