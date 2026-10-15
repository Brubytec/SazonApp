package com.sazonysabor.sazonapp.ui.mesas

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sazonysabor.sazonapp.data.model.EstadoMesa
import com.sazonysabor.sazonapp.data.model.Mesa
import com.sazonysabor.sazonapp.data.repository.SazonRepository
import com.sazonysabor.sazonapp.di.ServiceLocator
import com.sazonysabor.sazonapp.ui.comun.ErrorUi
import com.sazonysabor.sazonapp.ui.comun.aErrorUi
import kotlinx.coroutines.launch

enum class FiltroMesas { TODAS, LIBRES, OCUPADAS, RESERVADAS }

data class MesasUi(
    val mesas: List<Mesa>,
    val total: Int,
    val libres: Int,
    val ocupadas: Int,
    val reservadas: Int,
    /** Suma de los pedidos abiertos (lo que falta por facturar). */
    val porCobrar: Int
)

class MesasViewModel(
    private val repositorio: SazonRepository = ServiceLocator.repositorio
) : ViewModel() {

    private val _estado = MutableLiveData<MesasUi>()
    val estado: LiveData<MesasUi> = _estado

    private val _error = MutableLiveData<ErrorUi?>()
    val error: LiveData<ErrorUi?> = _error

    private val _cargando = MutableLiveData(false)
    val cargando: LiveData<Boolean> = _cargando

    private var todas: List<Mesa> = emptyList()
    private var filtro = FiltroMesas.TODAS

    /** GET /api/mesas (vista_estado_mesas) */
    fun cargar() {
        _cargando.value = true
        viewModelScope.launch {
            repositorio.obtenerMesas()
                .onSuccess {
                    todas = it
                    publicar()
                }
                .onFailure { _error.value = it.aErrorUi() }
            _cargando.value = false
        }
    }

    fun cambiarFiltro(nuevo: FiltroMesas) {
        filtro = nuevo
        publicar()
    }

    fun errorMostrado() {
        _error.value = null
    }

    private fun publicar() {
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
            porCobrar = todas.sumOf { it.totalCuenta }
        )
    }
}
