package com.sazonysabor.sazonapp.ui.mesas

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.sazonysabor.sazonapp.data.model.EstadoMesa
import com.sazonysabor.sazonapp.data.model.Mesa
import com.sazonysabor.sazonapp.data.repository.DemoRepository

enum class FiltroMesas { TODAS, LIBRES, OCUPADAS, RESERVADAS }

data class MesasUi(
    val mesas: List<Mesa>,
    val total: Int,
    val libres: Int,
    val ocupadas: Int,
    val reservadas: Int,
    val propina: Int
)

class MesasViewModel : ViewModel() {

    private val _estado = MutableLiveData<MesasUi>()
    val estado: LiveData<MesasUi> = _estado

    private var filtro = FiltroMesas.TODAS

    fun cargar() {
        val todas = DemoRepository.obtenerMesas()
        val visibles = when (filtro) {
            FiltroMesas.TODAS -> todas
            FiltroMesas.LIBRES -> todas.filter { it.estado == EstadoMesa.DISPONIBLE }
            FiltroMesas.OCUPADAS -> todas.filter { it.estado == EstadoMesa.OCUPADA }
            FiltroMesas.RESERVADAS -> todas.filter { it.estado == EstadoMesa.RESERVADA }
        }
        _estado.value = MesasUi(
            mesas = visibles,
            total = todas.size,
            libres = todas.count { it.estado == EstadoMesa.DISPONIBLE },
            ocupadas = todas.count { it.estado == EstadoMesa.OCUPADA },
            reservadas = todas.count { it.estado == EstadoMesa.RESERVADA },
            propina = DemoRepository.propinaDelDia()
        )
    }

    fun cambiarFiltro(nuevo: FiltroMesas) {
        filtro = nuevo
        cargar()
    }
}