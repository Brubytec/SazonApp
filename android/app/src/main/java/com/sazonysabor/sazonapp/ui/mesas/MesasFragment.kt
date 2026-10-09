package com.sazonysabor.sazonapp.ui.mesas

import android.content.Intent
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
import com.sazonysabor.sazonapp.data.local.SesionManager
import com.sazonysabor.sazonapp.data.model.EstadoMesa
import com.sazonysabor.sazonapp.data.model.Mesa
import com.sazonysabor.sazonapp.databinding.FragmentMesasBinding
import com.sazonysabor.sazonapp.ui.login.LoginActivity
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

        val usuario = SesionManager(requireContext()).usuarioActual()
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
        binding.tvPropina.text = Formato.moneda(ui.propina)
        adapter.submitList(ui.mesas)
        binding.tvVacio.visibility = if (ui.mesas.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun alSeleccionarMesa(mesa: Mesa) {
        if (mesa.estado == EstadoMesa.RESERVADA) {
            Snackbar.make(binding.root, "La mesa ${mesa.numero} está reservada", Snackbar.LENGTH_SHORT).show()
        } else {
            startActivity(NuevoPedidoActivity.intent(requireContext(), mesa.numero))
        }
    }

    private fun confirmarSalida() {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Cerrar sesión")
            .setMessage("¿Deseas salir de SazonApp?")
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Salir") { _, _ ->
                SesionManager(requireContext()).cerrar()
                val intent = Intent(requireContext(), LoginActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                startActivity(intent)
            }
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}