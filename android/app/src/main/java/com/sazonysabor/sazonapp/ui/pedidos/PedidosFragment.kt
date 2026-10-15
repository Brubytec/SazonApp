package com.sazonysabor.sazonapp.ui.pedidos

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.sazonysabor.sazonapp.data.model.EstadoPedido
import com.sazonysabor.sazonapp.databinding.FragmentPedidosBinding
import com.sazonysabor.sazonapp.ui.comun.cerrarSesionYVolverAlLogin
import com.sazonysabor.sazonapp.ui.nuevopedido.NuevoPedidoActivity
import com.sazonysabor.sazonapp.util.aplicarInsetSuperior

/** Sirve para dos pestañas: "Pedidos" (abiertos) e "Historial" (facturados hoy). */
class PedidosFragment : Fragment() {

    private var _binding: FragmentPedidosBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: PedidosViewModel

    private val esHistorial: Boolean
        get() = requireArguments().getBoolean(ARG_HISTORIAL)

    private val adapter = PedidosAdapter(
        alTocar = { pedido ->
            // Un pedido abierto se puede ampliar con más productos.
            if (pedido.estado == EstadoPedido.ABIERTO) {
                startActivity(
                    NuevoPedidoActivity.intent(
                        contexto = requireContext(),
                        idMesa = 0,
                        mesaNumero = pedido.mesaNumero,
                        idPedido = pedido.id
                    )
                )
            }
        }
    )

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPedidosBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding.header.aplicarInsetSuperior()
        viewModel = ViewModelProvider(this)[PedidosViewModel::class.java]

        if (esHistorial) {
            binding.tvTitulo.text = "Historial"
            binding.tvSubtitulo.text = "Pedidos facturados hoy"
        } else {
            binding.tvTitulo.text = "Pedidos activos"
            binding.tvSubtitulo.text = "Toca un pedido para agregar productos"
        }

        binding.rvPedidos.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPedidos.adapter = adapter

        viewModel.pedidos.observe(viewLifecycleOwner) { lista ->
            adapter.submitList(lista)
            binding.tvVacio.text = if (esHistorial) "Aún no hay pedidos facturados hoy" else "No hay pedidos activos"
            binding.tvVacio.visibility = if (lista.isEmpty()) View.VISIBLE else View.GONE
        }

        viewModel.cargando.observe(viewLifecycleOwner) { cargando ->
            if (cargando && adapter.itemCount == 0) {
                binding.tvVacio.text = "Cargando..."
                binding.tvVacio.visibility = View.VISIBLE
            }
        }

        viewModel.error.observe(viewLifecycleOwner) { error ->
            if (error == null) return@observe
            viewModel.errorMostrado()
            if (error.sesionExpirada) {
                requireActivity().cerrarSesionYVolverAlLogin(error.mensaje)
            } else {
                Snackbar.make(binding.root, error.mensaje, Snackbar.LENGTH_LONG)
                    .setAction("Reintentar") { viewModel.cargar(esHistorial) }
                    .show()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.cargar(esHistorial)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_HISTORIAL = "arg_historial"

        fun nuevo(historial: Boolean): PedidosFragment =
            PedidosFragment().apply { arguments = bundleOf(ARG_HISTORIAL to historial) }
    }
}
