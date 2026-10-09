package com.sazonysabor.sazonapp.data.local

import android.content.Context
import android.content.SharedPreferences
import com.sazonysabor.sazonapp.data.model.Usuario

class SesionManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("SazonAppPrefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_NOMBRE = "usuario_nombre"
        private const val KEY_CORREO = "usuario_correo"
        private const val KEY_RECORDAR = "debe_recordar"
    }

    fun iniciar(usuario: Usuario, recordar: Boolean) {
        prefs.edit().apply {
            putString(KEY_NOMBRE, usuario.nombre)
            putString(KEY_CORREO, usuario.correo)
            putBoolean(KEY_RECORDAR, recordar)
            apply()
        }
    }

    fun debeRecordar(): Boolean {
        return prefs.getBoolean(KEY_RECORDAR, false) && usuarioActual() != null
    }

    fun usuarioActual(): Usuario? {
        val nombre = prefs.getString(KEY_NOMBRE, null)
        val correo = prefs.getString(KEY_CORREO, null)
        return if (nombre != null && correo != null) {
            Usuario(nombre, correo)
        } else {
            null
        }
    }

    fun cerrar() {
        prefs.edit().clear().apply()
    }
}