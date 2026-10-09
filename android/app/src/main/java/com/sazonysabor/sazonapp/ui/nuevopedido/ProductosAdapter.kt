package com.sazonysabor.sazonapp.ui.nuevopedido

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.sazonysabor.sazonapp.R
import com.sazonysabor.sazonapp.data.model.Producto
import com.sazonysabor.sazonapp.databinding.ItemProductoBinding
import com.sazonysabor.sazonapp.util.Formato

private object LineaDiff : DiffUtil.ItemCallback<LineaProducto>() {
    override fun areItemsTheSame(anterior: LineaProducto, nueva: LineaProducto) =
        anterior.producto.id == nueva.producto.id

    override fun areContentsTheSame(anterior: LineaProducto, nueva: LineaProducto) = anterior == nueva
}

class ProductosAdapter(
    private val alCambiar: (Producto, Int) -> Unit
) : ListAdapter<LineaProducto, ProductosAdapter.VH>(LineaDiff) {

    class VH(val b: ItemProductoBinding) : RecyclerView.ViewHolder(b.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemProductoBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) {
        val linea = getItem(position)
        val producto = linea.producto
        val b = holder.b

        b.tvNombre.text = producto.nombre
        b.tvDescripcion.text = producto.descripcion
        b.tvPrecio.text = Formato.moneda(producto.precio)
        b.tvCantidad.text = linea.cantidad.toString()

        val contexto = b.tarjeta.context
        val colorBorde = if (linea.cantidad > 0) R.color.rosa else R.color.borde
        b.tarjeta.strokeColor = ContextCompat.getColor(contexto, colorBorde)

        b.panelCantidad.visibility = if (producto.disponible) View.VISIBLE else View.GONE
        b.tvAgotado.visibility = if (producto.disponible) View.GONE else View.VISIBLE
        b.tarjeta.alpha = if (producto.disponible) 1f else 0.55f

        b.btnMenos.isEnabled = linea.cantidad > 0
        b.btnMenos.setOnClickListener { alCambiar(producto, -1) }
        b.btnMas.setOnClickListener { alCambiar(producto, 1) }
    }
}