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
import com.sazonysabor.sazonapp.R
import com.sazonysabor.sazonapp.data.model.CategoriaProducto
import com.sazonysabor.sazonapp.databinding.ActivityNuevoPedidoBinding
import com.sazonysabor.sazonapp.util.Formato
import com.sazonysabor.sazonapp.util.aplicarInsetInferior
import com.sazonysabor.sazonapp.util.aplicarInsetSuperior
import com.sazonysabor.sazonapp.util.configurarBarras

class NuevoPedidoActivity : AppCompatActivity() {

    private lateinit var binding: ActivityNuevoPedidoBinding
    private lateinit var viewModel: NuevoPedidoViewModel

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
        viewModel.mesaNumero = intent.getIntExtra(EXTRA_MESA, 0)
        binding.tvMesa.text = "Mesa ${viewModel.mesaNumero}"

        binding.btnVolver.setOnClickListener { finish() }
        crearChipsDeCategorias()

        binding.rvProductos.layoutManager = LinearLayoutManager(this)
        binding.rvProductos.adapter = adapter

        binding.btnEnviar.setOnClickListener {
            viewModel.enviar(binding.etObservaciones.text?.toString().orEmpty())
        }

        viewModel.ui.observe(this) { ui ->
            adapter.submitList(ui.productos)
            binding.tvSubtotal.text = Formato.moneda(ui.subtotal)
            binding.tvImpuesto.text = Formato.moneda(ui.impuesto)
            binding.tvTotal.text = Formato.moneda(ui.total)
            binding.btnEnviar.isEnabled = ui.unidades > 0
            binding.btnEnviar.text = if (ui.unidades > 0) {
                "ENVIAR PEDIDO A COCINA (${ui.unidades})"
            } else {
                "ENVIAR PEDIDO A COCINA"
            }
        }

        viewModel.enviado.observe(this) { pedido ->
            if (pedido != null) {
                Toast.makeText(
                    this,
                    "Pedido #${pedido.numero} enviado a cocina (Mesa ${pedido.mesaNumero})",
                    Toast.LENGTH_LONG
                ).show()
                finish()
            }
        }
    }

    private fun crearChipsDeCategorias() {
        val seleccionada = viewModel.categoriaSeleccionada()
        for (categoria in CategoriaProducto.values()) {
            val chip = layoutInflater.inflate(
                R.layout.chip_categoria,
                binding.chipsCategorias,
                false
            ) as Chip
            chip.id = View.generateViewId()
            chip.text = categoria.etiqueta
            chip.isChecked = categoria == seleccionada
            chip.setOnCheckedChangeListener { _, marcado ->
                if (marcado) viewModel.seleccionarCategoria(categoria)
            }
            binding.chipsCategorias.addView(chip)
        }
    }

    companion object {
        private const val EXTRA_MESA = "extra_mesa"

        fun intent(contexto: Context, mesa: Int): Intent =
            Intent(contexto, NuevoPedidoActivity::class.java).putExtra(EXTRA_MESA, mesa)
    }
}