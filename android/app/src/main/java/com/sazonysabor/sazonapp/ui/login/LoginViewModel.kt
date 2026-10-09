package com.sazonysabor.sazonapp.ui.login

import android.util.Patterns
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.sazonysabor.sazonapp.data.model.Usuario
import com.sazonysabor.sazonapp.data.repository.DemoRepository

sealed class ResultadoLogin {
    data class Exito(val usuario: Usuario) : ResultadoLogin()
    data class Error(val mensaje: String) : ResultadoLogin()
}

class LoginViewModel : ViewModel() {

    private val _resultado = MutableLiveData<ResultadoLogin?>()
    val resultado: LiveData<ResultadoLogin?> = _resultado

    fun iniciarSesion(correo: String, clave: String) {
        _resultado.value = when {
            correo.isBlank() -> ResultadoLogin.Error("Ingresa tu correo electrónico")
            !Patterns.EMAIL_ADDRESS.matcher(correo.trim()).matches() ->
                ResultadoLogin.Error("El correo no tiene un formato válido")
            clave.isBlank() -> ResultadoLogin.Error("Ingresa tu contraseña")
            else -> {
                val usuario = DemoRepository.iniciarSesion(correo, clave)
                if (usuario != null) {
                    ResultadoLogin.Exito(usuario)
                } else {
                    ResultadoLogin.Error("Correo o contraseña incorrectos")
                }
            }
        }
    }

    fun resultadoConsumido() {
        _resultado.value = null
    }
}