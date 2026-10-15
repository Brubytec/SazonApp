package com.sazonysabor.sazonapp.ui.nuevopedido

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sazonysabor.sazonapp.data.model.Producto
import com.sazonysabor.sazonapp.data.remote.Mapeadores
import com.sazonysabor.sazonapp.data.repository.ItemNuevo
import com.sazonysabor.sazonapp.data.repository.PedidoEnviado
import com.sazonysabor.sazonapp.data.repository.SazonRepository
import com.sazonysabor.sazonapp.di.ServiceLocator
import com.sazonysabor.sazonapp.ui.comun.ErrorUi
import com.sazonysabor.sazonapp.ui.comun.aErrorUi
import kotlinx.coroutines.launch

data class LineaProducto(val producto: Producto, val cantidad: Int)

data class NuevoPedidoUi(
    val categorias: List<String>,
    val categoria: String?,
    val productos: List<LineaProducto>,
    /** Total de lo que se va a agregar. Es el mismo cálculo que hace sp_AgregarDetallePedido. */
    val total: Int,
    val unidades: Int
)

class NuevoPedidoViewModel(
    private val repositorio: SazonRepository = ServiceLocator.repositorio
) : ViewModel() {

    var idMesa: Int = 0
    var mesaNumero: Int = 0
    /** null = la mesa está libre y se creará un pedido nuevo. */
    var idPedido: Int? = null

    private var catalogo: List<Producto> = emptyList()
    private val cantidades = mutableMapOf<Int, Int>()
    private var categoria: String? = null

    private val _ui = MutableLiveData<NuevoPedidoUi>()
    val ui: LiveData<NuevoPedidoUi> = _ui

    private val _enviando = MutableLiveData(false)
    val enviando: LiveData<Boolean> = _enviando

    private val _enviado = MutableLiveData<PedidoEnviado?>()
    val enviado: LiveData<PedidoEnviado?> = _enviado

    private val _error = MutableLiveData<ErrorUi?>()
    val error: LiveData<ErrorUi?> = _error

    /** GET /api/productos */
    fun cargarProductos() {
        if (catalogo.isNotEmpty()) return
        viewModelScope.launch {
            repositorio.obtenerProductos()
                .onSuccess {
                    catalogo = it
                    categoria = Mapeadores.categorias(it).firstOrNull()
                    publicar()
                }
                .onFailure { _error.value = it.aErrorUi() }
        }
    }

    fun seleccionarCategoria(nueva: String) {
        categoria = nueva
        publicar()
    }

    fun cambiarCantidad(producto: Producto, delta: Int) {
        if (!producto.disponible) return
        val nueva = ((cantidades[producto.id] ?: 0) + delta).coerceIn(0, 20)
        if (nueva == 0) cantidades.remove(producto.id) else cantidades[producto.id] = nueva
        publicar()
    }

    /** POST /api/pedidos (si la mesa está libre) + POST /api/pedidos/:id/productos por cada producto. */
    fun enviar() {
        if (_enviando.value == true) return
        val items = catalogo
            .filter { cantidades.containsKey(it.id) }
            .map { ItemNuevo(it.id, cantidades.getValue(it.id)) }
        if (items.isEmpty()) return

        _enviando.value = true
        viewModelScope.launch {
            repositorio.enviarPedido(idMesa, idPedido, items)
                .onSuccess { _enviado.value = it }
                .onFailure { _error.value = it.aErrorUi() }
            _enviando.value = false
        }
    }

    fun errorMostrado() {
        _error.value = null
    }

    private fun publicar() {
        val lineas = catalogo
            .filter { it.categoria == categoria }
            .map { LineaProducto(it, cantidades[it.id] ?: 0) }
        _ui.value = NuevoPedidoUi(
            categorias = Mapeadores.categorias(catalogo),
            categoria = categoria,
            productos = lineas,
            total = catalogo.sumOf { it.precio * (cantidades[it.id] ?: 0) },
            unidades = cantidades.values.sum()
        )
    }
}
