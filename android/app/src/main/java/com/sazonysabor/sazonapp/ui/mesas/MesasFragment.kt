package com.sazonysabor.sazonapp.ui.mesas

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.sazonysabor.sazonapp.R
import com.sazonysabor.sazonapp.data.model.EstadoMesa
import com.sazonysabor.sazonapp.data.model.Mesa
import com.sazonysabor.sazonapp.databinding.FragmentMesasBinding
import com.sazonysabor.sazonapp.di.ServiceLocator
import com.sazonysabor.sazonapp.ui.comun.cerrarSesionYVolverAlLogin
import com.sazonysabor.sazonapp.ui.nuevopedido.NuevoPedidoActivity
import com.sazonysabor.sazonapp.util.Formato
import com.sazonysabor.sazonapp.util.aplicarInsetSuperior
import java.util.Calendar

class MesasFragment : Fragment() {

    private var _binding: FragmentMesasBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: MesasViewModel
    private val adapter = MesasAdapter { mesa -> alSeleccionarMesa(mesa) }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMesasBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding.header.aplicarInsetSuperior()
        viewModel = ViewModelProvider(this)[MesasViewModel::class.java]

        val usuario = ServiceLocator.sesion.usuarioActual()
        val nombre = usuario?.nombre?.split(" ")?.take(2)?.joinToString(" ") ?: "mesero"
        binding.tvSaludo.text = "Hola, $nombre"

        val hora = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        binding.tvTurno.text = when {
            hora < 11 -> "Turno de mañana"
            hora < 16 -> "Turno de almuerzo"
            else -> "Turno de cena"
        }

        binding.rvMesas.layoutManager = LinearLayoutManager(requireContext())
        binding.rvMesas.adapter = adapter
        binding.btnSalir.setOnClickListener { confirmarSalida() }

        binding.chipGroup.setOnCheckedStateChangeListener { _, ids ->
            val filtro = when (ids.firstOrNull()) {
                R.id.chipLibres -> FiltroMesas.LIBRES
                R.id.chipOcupadas -> FiltroMesas.OCUPADAS
                R.id.chipReservadas -> FiltroMesas.RESERVADAS
                else -> FiltroMesas.TODAS
            }
            viewModel.cambiarFiltro(filtro)
        }

        viewModel.estado.observe(viewLifecycleOwner) { ui -> mostrar(ui) }

        viewModel.error.observe(viewLifecycleOwner) { error ->
            if (error == null) return@observe
            viewModel.errorMostrado()
            if (error.sesionExpirada) {
                requireActivity().cerrarSesionYVolverAlLogin(error.mensaje)
            } else {
                Snackbar.make(binding.root, error.mensaje, Snackbar.LENGTH_LONG)
                    .setAction("Reintentar") { viewModel.cargar() }
                    .show()
            }
        }

        viewModel.cargando.observe(viewLifecycleOwner) { cargando ->
            if (cargando && adapter.itemCount == 0) {
                binding.tvVacio.text = "Cargando mesas..."
                binding.tvVacio.visibility = View.VISIBLE
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.cargar()
    }

    private fun mostrar(ui: MesasUi) {
        binding.chipTodas.text = "Todas (${ui.total})"
        binding.chipLibres.text = "Libres (${ui.libres})"
        binding.chipOcupadas.text = "Ocupadas (${ui.ocupadas})"
        binding.chipReservadas.text = "Reservadas (${ui.reservadas})"
        binding.tvMisMesas.text = "${ui.ocupadas} activas"
        binding.tvPropina.text = Formato.moneda(ui.porCobrar)
        adapter.submitList(ui.mesas)
        binding.tvVacio.text = "No hay mesas con este filtro"
        binding.tvVacio.visibility = if (ui.mesas.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun alSeleccionarMesa(mesa: Mesa) {
        if (mesa.estado == EstadoMesa.RESERVADA) {
            Snackbar.make(binding.root, "La mesa ${mesa.numero} está reservada", Snackbar.LENGTH_SHORT).show()
        } else {
            // Mesa libre → se abre un pedido nuevo. Mesa ocupada → se agregan productos a su pedido abierto.
            startActivity(
                NuevoPedidoActivity.intent(
                    contexto = requireContext(),
                    idMesa = mesa.id,
                    mesaNumero = mesa.numero,
                    idPedido = mesa.idPedido
                )
            )
        }
    }

    private fun confirmarSalida() {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Cerrar sesión")
            .setMessage("¿Deseas salir de SazonApp?")
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Salir") { _, _ ->
                requireActivity().cerrarSesionYVolverAlLogin()
            }
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}