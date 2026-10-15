package com.sazonysabor.sazonapp.ui.login

import android.util.Patterns
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sazonysabor.sazonapp.data.model.Sesion
import com.sazonysabor.sazonapp.data.repository.SazonRepository
import com.sazonysabor.sazonapp.di.ServiceLocator
import kotlinx.coroutines.launch

sealed class ResultadoLogin {
    data class Exito(val sesion: Sesion) : ResultadoLogin()
    data class Error(val mensaje: String) : ResultadoLogin()
}

class LoginViewModel(
    private val repositorio: SazonRepository = ServiceLocator.repositorio
) : ViewModel() {

    private val _resultado = MutableLiveData<ResultadoLogin?>()
    val resultado: LiveData<ResultadoLogin?> = _resultado

    private val _cargando = MutableLiveData(false)
    val cargando: LiveData<Boolean> = _cargando

    fun iniciarSesion(correo: String, clave: String) {
        if (_cargando.value == true) return
        val error = when {
            correo.isBlank() -> "Ingresa tu correo electrónico"
            !Patterns.EMAIL_ADDRESS.matcher(correo.trim()).matches() -> "El correo no tiene un formato válido"
            clave.isBlank() -> "Ingresa tu contraseña"
            else -> null
        }
        if (error != null) {
            _resultado.value = ResultadoLogin.Error(error)
            return
        }

        _cargando.value = true
        viewModelScope.launch {
            // POST /api/auth/login → { token, usuario }
            repositorio.iniciarSesion(correo, clave)
                .onSuccess { _resultado.value = ResultadoLogin.Exito(it) }
                .onFailure { _resultado.value = ResultadoLogin.Error(it.message ?: "No se pudo iniciar sesión") }
            _cargando.value = false
        }
    }

    fun resultadoConsumido() {
        _resultado.value = null
    }
}
