package com.sazonysabor.sazonapp.data.local

import android.content.Context
import android.content.SharedPreferences
import com.sazonysabor.sazonapp.data.model.Sesion
import com.sazonysabor.sazonapp.data.model.Usuario

/** Guarda el JWT y los datos del usuario que devolvió POST /auth/login. */
class SesionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences("SazonAppPrefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_TOKEN = "token"
        private const val KEY_ID = "usuario_id"
        private const val KEY_NOMBRE = "usuario_nombre"
        private const val KEY_CORREO = "usuario_correo"
        private const val KEY_ROL = "usuario_rol"
        private const val KEY_RECORDAR = "debe_recordar"
    }

    fun iniciar(sesion: Sesion, recordar: Boolean) {
        prefs.edit().apply {
            putString(KEY_TOKEN, sesion.token)
            putInt(KEY_ID, sesion.usuario.id)
            putString(KEY_NOMBRE, sesion.usuario.nombre)
            putString(KEY_CORREO, sesion.usuario.correo)
            putString(KEY_ROL, sesion.usuario.rol)
            putBoolean(KEY_RECORDAR, recordar)
            apply()
        }
    }

    fun token(): String? = prefs.getString(KEY_TOKEN, null)

    /** Si el token expiró, la primera petición devolverá 401 y la app vuelve al login. */
    fun debeRecordar(): Boolean =
        prefs.getBoolean(KEY_RECORDAR, false) && !token().isNullOrBlank()

    fun usuarioActual(): Usuario? {
        val nombre = prefs.getString(KEY_NOMBRE, null) ?: return null
        return Usuario(
            id = prefs.getInt(KEY_ID, 0),
            nombre = nombre,
            correo = prefs.getString(KEY_CORREO, null).orEmpty(),
            rol = prefs.getString(KEY_ROL, null).orEmpty()
        )
    }

    fun cerrar() {
        prefs.edit().clear().apply()
    }
}
