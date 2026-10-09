package com.sazonysabor.sazonapp.ui.pedidos

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.sazonysabor.sazonapp.data.model.Pedido
import com.sazonysabor.sazonapp.data.repository.DemoRepository

class PedidosViewModel : ViewModel() {

    private val _pedidos = MutableLiveData<List<Pedido>>()
    val pedidos: LiveData<List<Pedido>> = _pedidos

    fun cargar(historial: Boolean) {
        _pedidos.value = if (historial) {
            DemoRepository.obtenerHistorial()
        } else {
            DemoRepository.obtenerPedidosActivos()
        }
    }

    fun avanzar(idPedido: Int, historial: Boolean) {
        DemoRepository.avanzarEstado(idPedido)
        cargar(historial)
    }
}