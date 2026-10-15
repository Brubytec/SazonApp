package com.sazonysabor.sazonapp.di

import android.content.Context
import com.sazonysabor.sazonapp.data.local.SesionManager
import com.sazonysabor.sazonapp.data.remote.ApiClient
import com.sazonysabor.sazonapp.data.repository.SazonRepository

/**
 * Inyección de dependencias manual (F-03, sección 6.3 → di/).
 * Se inicializa una sola vez en SazonApplication.
 */
object ServiceLocator {

    lateinit var sesion: SesionManager
        private set

    lateinit var repositorio: SazonRepository
        private set

    fun iniciar(context: Context) {
        sesion = SesionManager(context)
        val api = ApiClient.crear(obtenerToken = { sesion.token() })
        repositorio = SazonRepository(api)
    }
}
