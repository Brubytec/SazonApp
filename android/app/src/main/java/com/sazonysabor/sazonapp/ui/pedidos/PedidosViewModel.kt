package com.sazonysabor.sazonapp.ui.pedidos

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sazonysabor.sazonapp.data.model.Pedido
import com.sazonysabor.sazonapp.data.repository.SazonRepository
import com.sazonysabor.sazonapp.di.ServiceLocator
import com.sazonysabor.sazonapp.ui.comun.ErrorUi
import com.sazonysabor.sazonapp.ui.comun.aErrorUi
import kotlinx.coroutines.launch

class PedidosViewModel(
    private val repositorio: SazonRepository = ServiceLocator.repositorio
) : ViewModel() {

    private val _pedidos = MutableLiveData<List<Pedido>>()
    val pedidos: LiveData<List<Pedido>> = _pedidos

    private val _error = MutableLiveData<ErrorUi?>()
    val error: LiveData<ErrorUi?> = _error

    private val _cargando = MutableLiveData(false)
    val cargando: LiveData<Boolean> = _cargando

    /**
     * Pedidos → GET /api/pedidos/activos (+ GET /api/pedidos/:id para los productos)
     * Historial → GET /api/facturas?fechaInicio=hoy&fechaFin=hoy (+ GET /api/facturas/:id)
     */
    fun cargar(historial: Boolean) {
        _cargando.value = true
        viewModelScope.launch {
            val resultado = if (historial) {
                repositorio.obtenerHistorialDeHoy()
            } else {
                repositorio.obtenerPedidosActivos()
            }
            resultado
                .onSuccess { _pedidos.value = it }
                .onFailure { _error.value = it.aErrorUi() }
            _cargando.value = false
        }
    }

    fun errorMostrado() {
        _error.value = null
    }
}
