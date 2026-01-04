package com.example.potiongo

import android.app.Application
import com.example.potiongo.data.AppContainer
import com.example.potiongo.data.DefaultAppContainer

class PotionGoApplication : Application() {
    lateinit var container: AppContainer
    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer()
    }
}