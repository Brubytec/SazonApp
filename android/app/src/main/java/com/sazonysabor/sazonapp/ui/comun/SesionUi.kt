package com.sazonysabor.sazonapp.ui.comun

import android.app.Activity
import android.content.Intent
import android.widget.Toast
import com.sazonysabor.sazonapp.di.ServiceLocator
import com.sazonysabor.sazonapp.ui.login.LoginActivity

/** Error listo para mostrar en pantalla. */
data class ErrorUi(val mensaje: String, val sesionExpirada: Boolean = false)

fun Throwable.aErrorUi(): ErrorUi {
    val api = this as? com.sazonysabor.sazonapp.data.repository.ApiException
    return ErrorUi(
        mensaje = api?.message ?: "Ocurrió un error inesperado",
        sesionExpirada = api?.sesionExpirada == true
    )
}

/** Borra el token y vuelve al login (token vencido o inválido). */
fun Activity.cerrarSesionYVolverAlLogin(mensaje: String? = null) {
    ServiceLocator.sesion.cerrar()
    mensaje?.let { Toast.makeText(this, it, Toast.LENGTH_LONG).show() }
    startActivity(
        Intent(this, LoginActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
    )
}
