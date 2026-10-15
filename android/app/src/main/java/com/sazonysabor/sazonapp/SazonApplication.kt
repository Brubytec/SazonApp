package com.sazonysabor.sazonapp

import android.app.Application
import com.sazonysabor.sazonapp.di.ServiceLocator

class SazonApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ServiceLocator.iniciar(this)
    }
}
