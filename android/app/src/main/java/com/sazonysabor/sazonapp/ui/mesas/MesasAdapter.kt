package com.sazonysabor.sazonapp.ui.mesas

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.sazonysabor.sazonapp.data.model.EstadoMesa
import com.sazonysabor.sazonapp.data.model.Mesa
import com.sazonysabor.sazonapp.databinding.ItemMesaBinding
import com.sazonysabor.sazonapp.util.Estilos
import com.sazonysabor.sazonapp.util.Formato

private object MesaDiff : DiffUtil.ItemCallback<Mesa>() {
    override fun areItemsTheSame(anterior: Mesa, nueva: Mesa) = anterior.numero == nueva.numero
    override fun areContentsTheSame(anterior: Mesa, nueva: Mesa) = anterior == nueva
}

class MesasAdapter(
    private val alTocar: (Mesa) -> Unit
) : ListAdapter<Mesa, MesasAdapter.VH>(MesaDiff) {

    class VH(val b: ItemMesaBinding) : RecyclerView.ViewHolder(b.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemMesaBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) {
        val mesa = getItem(position)
        val b = holder.b
        b.tvNumero.text = "Mesa ${mesa.numero}"
        b.tvCapacidad.text = "${mesa.capacidad} personas"
        Estilos.badge(b.tvEstado, mesa.estado)

        val ocupada = mesa.estado == EstadoMesa.OCUPADA
        b.panelCuenta.visibility = if (ocupada) View.VISIBLE else View.GONE
        if (ocupada) {
            b.tvTotal.text = Formato.moneda(mesa.totalCuenta)
            b.tvTiempo.text = mesa.ocupadaDesdeMs?.let { Formato.hace(it) } ?: ""
        }
        b.root.setOnClickListener { alTocar(mesa) }
    }
}