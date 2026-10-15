package com.sazonysabor.sazonapp.ui.nuevopedido

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.chip.Chip
import com.google.android.material.snackbar.Snackbar
import com.sazonysabor.sazonapp.R
import com.sazonysabor.sazonapp.databinding.ActivityNuevoPedidoBinding
import com.sazonysabor.sazonapp.ui.comun.cerrarSesionYVolverAlLogin
import com.sazonysabor.sazonapp.util.Formato
import com.sazonysabor.sazonapp.util.aplicarInsetInferior
import com.sazonysabor.sazonapp.util.aplicarInsetSuperior
import com.sazonysabor.sazonapp.util.configurarBarras

class NuevoPedidoActivity : AppCompatActivity() {

    private lateinit var binding: ActivityNuevoPedidoBinding
    private lateinit var viewModel: NuevoPedidoViewModel
    private var chipsCreados = false

    private val adapter = ProductosAdapter { producto, delta ->
        viewModel.cambiarCantidad(producto, delta)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configurarBarras()
        binding = ActivityNuevoPedidoBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.header.aplicarInsetSuperior()
        binding.panelInferior.aplicarInsetInferior()

        viewModel = ViewModelProvider(this)[NuevoPedidoViewModel::class.java]
        viewModel.idMesa = intent.getIntExtra(EXTRA_ID_MESA, 0)
        viewModel.mesaNumero = intent.getIntExtra(EXTRA_MESA, 0)
        viewModel.idPedido = intent.getIntExtra(EXTRA_ID_PEDIDO, SIN_PEDIDO).takeIf { it != SIN_PEDIDO }

        binding.tvMesa.text = viewModel.idPedido
            ?.let { "Mesa ${viewModel.mesaNumero} · agregar al pedido #$it" }
            ?: "Mesa ${viewModel.mesaNumero}"

        binding.btnVolver.setOnClickListener { finish() }
        binding.rvProductos.layoutManager = LinearLayoutManager(this)
        binding.rvProductos.adapter = adapter
        binding.btnEnviar.setOnClickListener { viewModel.enviar() }
        actualizarBoton(unidades = 0, enviando = false)

        viewModel.ui.observe(this) { ui ->
            if (!chipsCreados && ui.categorias.isNotEmpty()) crearChipsDeCategorias(ui.categorias, ui.categoria)
            adapter.submitList(ui.productos)
            binding.tvSubtotal.text = Formato.moneda(ui.total)
            binding.tvTotal.text = Formato.moneda(ui.total)
            actualizarBoton(ui.unidades, viewModel.enviando.value == true)
        }

        viewModel.enviando.observe(this) { enviando ->
            actualizarBoton(viewModel.ui.value?.unidades ?: 0, enviando)
        }

        viewModel.enviado.observe(this) { resultado ->
            if (resultado != null) {
                Toast.makeText(
                    this,
                    "Pedido #${resultado.idPedido} enviado (Mesa ${viewModel.mesaNumero})",
                    Toast.LENGTH_LONG
                ).show()
                finish()
            }
        }

        viewModel.error.observe(this) { error ->
            if (error == null) return@observe
            viewModel.errorMostrado()
            if (error.sesionExpirada) {
                cerrarSesionYVolverAlLogin(error.mensaje)
            } else {
                Snackbar.make(binding.root, error.mensaje, Snackbar.LENGTH_LONG).show()
            }
        }

        viewModel.cargarProductos()
    }

    private fun actualizarBoton(unidades: Int, enviando: Boolean) {
        binding.btnEnviar.isEnabled = unidades > 0 && !enviando
        binding.btnEnviar.text = when {
            enviando -> "ENVIANDO..."
            unidades > 0 -> "ENVIAR PEDIDO A COCINA ($unidades)"
            else -> "ENVIAR PEDIDO A COCINA"
        }
    }

    /** Las categorías salen de la tabla `categoria` del backend, no de una lista fija. */
    private fun crearChipsDeCategorias(categorias: List<String>, seleccionada: String?) {
        chipsCreados = true
        binding.chipsCategorias.removeAllViews()
        for (categoria in categorias) {
            val chip = layoutInflater.inflate(
                R.layout.chip_categoria,
                binding.chipsCategorias,
                false
            ) as Chip
            chip.id = View.generateViewId()
            chip.text = categoria
            chip.isChecked = categoria == seleccionada
            chip.setOnCheckedChangeListener { _, marcado ->
                if (marcado) viewModel.seleccionarCategoria(categoria)
            }
            binding.chipsCategorias.addView(chip)
        }
    }

    companion object {
        private const val EXTRA_ID_MESA = "extra_id_mesa"
        private const val EXTRA_MESA = "extra_mesa"
        private const val EXTRA_ID_PEDIDO = "extra_id_pedido"
        private const val SIN_PEDIDO = -1

        /**
         * @param idMesa id_mesa en la base de datos (para crear el pedido).
         * @param idPedido pedido abierto de la mesa, o null si la mesa está libre.
         */
        fun intent(contexto: Context, idMesa: Int, mesaNumero: Int, idPedido: Int?): Intent =
            Intent(contexto, NuevoPedidoActivity::class.java)
                .putExtra(EXTRA_ID_MESA, idMesa)
                .putExtra(EXTRA_MESA, mesaNumero)
                .putExtra(EXTRA_ID_PEDIDO, idPedido ?: SIN_PEDIDO)
    }
}
