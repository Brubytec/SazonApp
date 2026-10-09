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
import com.sazonysabor.sazonapp.util.aplicarInsetSuperior

/** Sirve para dos pestañas: "Pedidos" (activos) e "Historial" (entregados). */
class PedidosFragment : Fragment() {

    private var _binding: FragmentPedidosBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: PedidosViewModel

    private val esHistorial: Boolean
        get() = requireArguments().getBoolean(ARG_HISTORIAL)

    private val adapter = PedidosAdapter(
        alTocar = { pedido ->
            // DEMO: simula el avance en cocina. Se elimina al conectar el backend.
            if (!esHistorial &&
                (pedido.estado == EstadoPedido.NUEVO || pedido.estado == EstadoPedido.EN_PREPARACION)
            ) {
                viewModel.avanzar(pedido.id, esHistorial)
            }
        },
        alEntregar = { pedido ->
            viewModel.avanzar(pedido.id, esHistorial)
            Snackbar.make(binding.root, "Pedido entregado a la mesa ${pedido.mesaNumero}", Snackbar.LENGTH_SHORT).show()
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
            binding.tvSubtitulo.text = "Pedidos entregados"
            binding.tvVacio.text = "Aún no hay pedidos entregados"
        } else {
            binding.tvTitulo.text = "Pedidos activos"
            binding.tvSubtitulo.text = "Demo: toca un pedido para simular el avance en cocina"
            binding.tvVacio.text = "No hay pedidos activos"
        }

        binding.rvPedidos.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPedidos.adapter = adapter

        viewModel.pedidos.observe(viewLifecycleOwner) { lista ->
            adapter.submitList(lista)
            binding.tvVacio.visibility = if (lista.isEmpty()) View.VISIBLE else View.GONE
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