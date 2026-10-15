package com.sazonysabor.sazonapp.ui.pedidos

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.sazonysabor.sazonapp.data.model.Pedido
import com.sazonysabor.sazonapp.databinding.ItemPedidoBinding
import com.sazonysabor.sazonapp.util.Estilos
import com.sazonysabor.sazonapp.util.Formato

private object PedidoDiff : DiffUtil.ItemCallback<Pedido>() {
    override fun areItemsTheSame(anterior: Pedido, nuevo: Pedido) = anterior.id == nuevo.id
    override fun areContentsTheSame(anterior: Pedido, nuevo: Pedido) = anterior == nuevo
}

class PedidosAdapter(
    private val alTocar: (Pedido) -> Unit
) : ListAdapter<Pedido, PedidosAdapter.VH>(PedidoDiff) {

    class VH(val b: ItemPedidoBinding) : RecyclerView.ViewHolder(b.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemPedidoBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) {
        val pedido = getItem(position)
        val b = holder.b
        b.tvNumero.text = pedido.codigo
        b.tvMesa.text = "Mesa ${pedido.mesaNumero}"
        Estilos.badge(b.tvEstado, pedido.estado)
        b.tvResumen.text = if (pedido.lineas.isEmpty()) {
            "Sin productos todavía"
        } else {
            pedido.lineas.joinToString("\n") { "${it.cantidad}× ${it.producto}" }
        }

        if (pedido.nota.isBlank()) {
            b.tvObservaciones.visibility = View.GONE
        } else {
            b.tvObservaciones.visibility = View.VISIBLE
            b.tvObservaciones.text = pedido.nota
        }

        b.tvTiempo.text = Formato.hace(pedido.minutos)
        b.tvTotal.text = Formato.moneda(pedido.total)

        // El backend no maneja estados de cocina (nuevo/en preparación/listo/entregado).
        b.btnEntregar.visibility = View.GONE
        b.root.setOnClickListener { alTocar(pedido) }
    }
}
