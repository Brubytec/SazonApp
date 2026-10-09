package com.sazonysabor.sazonapp.ui.nuevopedido

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.sazonysabor.sazonapp.data.model.CategoriaProducto
import com.sazonysabor.sazonapp.data.model.ItemPedido
import com.sazonysabor.sazonapp.data.model.Pedido
import com.sazonysabor.sazonapp.data.model.Producto
import com.sazonysabor.sazonapp.data.repository.DemoRepository
import com.sazonysabor.sazonapp.util.Formato

data class LineaProducto(val producto: Producto, val cantidad: Int)

data class NuevoPedidoUi(
    val productos: List<LineaProducto>,
    val subtotal: Int,
    val impuesto: Int,
    val total: Int,
    val unidades: Int
)

class NuevoPedidoViewModel : ViewModel() {

    var mesaNumero: Int = 0

    private val catalogo = DemoRepository.obtenerProductos()
    private val cantidades = mutableMapOf<Int, Int>()
    private var categoria = CategoriaProducto.ENTRADAS

    private val _ui = MutableLiveData<NuevoPedidoUi>()
    val ui: LiveData<NuevoPedidoUi> = _ui

    private val _enviado = MutableLiveData<Pedido?>()
    val enviado: LiveData<Pedido?> = _enviado

    init {
        publicar()
    }

    fun categoriaSeleccionada(): CategoriaProducto = categoria

    fun seleccionarCategoria(nueva: CategoriaProducto) {
        categoria = nueva
        publicar()
    }

    fun cambiarCantidad(producto: Producto, delta: Int) {
        if (!producto.disponible) return
        val nueva = ((cantidades[producto.id] ?: 0) + delta).coerceIn(0, 20)
        if (nueva == 0) cantidades.remove(producto.id) else cantidades[producto.id] = nueva
        publicar()
    }

    fun enviar(observaciones: String) {
        val items = catalogo
            .filter { cantidades.containsKey(it.id) }
            .map { ItemPedido(it, cantidades.getValue(it.id)) }
        if (items.isEmpty()) return
        _enviado.value = DemoRepository.crearPedido(mesaNumero, items, observaciones.trim())
    }

    private fun publicar() {
        val lineas = catalogo
            .filter { it.categoria == categoria }
            .map { LineaProducto(it, cantidades[it.id] ?: 0) }
        val subtotal = catalogo.sumOf { it.precio * (cantidades[it.id] ?: 0) }
        val impuesto = Formato.impuesto(subtotal)
        _ui.value = NuevoPedidoUi(
            productos = lineas,
            subtotal = subtotal,
            impuesto = impuesto,
            total = subtotal + impuesto,
            unidades = cantidades.values.sum()
        )
    }
}