package com.sazonysabor.sazonapp.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.inputmethod.EditorInfo
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.sazonysabor.sazonapp.data.local.SesionManager
import com.sazonysabor.sazonapp.databinding.ActivityLoginBinding
import com.sazonysabor.sazonapp.ui.main.MainActivity
import com.sazonysabor.sazonapp.util.aplicarInsetsCompletos
import com.sazonysabor.sazonapp.util.configurarBarras

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var viewModel: LoginViewModel
    private lateinit var sesion: SesionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configurarBarras()

        sesion = SesionManager(this)
        if (sesion.debeRecordar()) {
            irAlInicio()
            return
        }

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        binding.contenido.aplicarInsetsCompletos()

        viewModel = ViewModelProvider(this)[LoginViewModel::class.java]

        binding.btnIngresar.setOnClickListener { enviarFormulario() }
        binding.etClave.setOnEditorActionListener { _, accion, _ ->
            if (accion == EditorInfo.IME_ACTION_DONE) {
                enviarFormulario()
                true
            } else {
                false
            }
        }

        viewModel.resultado.observe(this) { resultado ->
            when (resultado) {
                is ResultadoLogin.Exito -> {
                    sesion.iniciar(resultado.usuario, binding.cbRecordar.isChecked)
                    viewModel.resultadoConsumido()
                    irAlInicio()
                }
                is ResultadoLogin.Error -> {
                    binding.tvError.text = resultado.mensaje
                    binding.tvError.visibility = View.VISIBLE
                    viewModel.resultadoConsumido()
                }
                null -> Unit
            }
        }
    }

    private fun enviarFormulario() {
        binding.tvError.visibility = View.GONE
        viewModel.iniciarSesion(
            correo = binding.etCorreo.text?.toString().orEmpty(),
            clave = binding.etClave.text?.toString().orEmpty()
        )
    }

    private fun irAlInicio() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}