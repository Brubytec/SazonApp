package com.sazonysabor.sazonapp.data.repository

import com.sazonysabor.sazonapp.data.model.Mesa
import com.sazonysabor.sazonapp.data.model.Pedido
import com.sazonysabor.sazonapp.data.model.Producto
import com.sazonysabor.sazonapp.data.model.Sesion
import com.sazonysabor.sazonapp.data.remote.ApiService
import com.sazonysabor.sazonapp.data.remote.Mapeadores
import com.sazonysabor.sazonapp.data.remote.dto.AgregarProductoRequest
import com.sazonysabor.sazonapp.data.remote.dto.CrearPedidoRequest
import com.sazonysabor.sazonapp.data.remote.dto.LoginRequest
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import retrofit2.HttpException
import java.io.IOException
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/** Error de la API ya traducido a un mensaje legible. */
class ApiException(
    override val message: String,
    val codigoHttp: Int? = null
) : Exception(message) {
    /** 401 en una ruta protegida = el JWT expiró o no es válido. */
    val sesionExpirada: Boolean get() = codigoHttp == 401
}

/** Lo que la app quiere agregar a un pedido: id del producto + cantidad. */
data class ItemNuevo(val idProducto: Int, val cantidad: Int)

data class PedidoEnviado(val idPedido: Int, val unidades: Int)

/**
 * Único punto de acceso a los datos del backend. Los ViewModels solo hablan
 * con esta clase; no saben si los datos vienen de Retrofit o de otro lado.
 */
class SazonRepository(private val api: ApiService) {

    private val zonaRestaurante = ZoneId.of("America/Bogota")

    private suspend fun <T> llamar(bloque: suspend () -> T): Result<T> = try {
        Result.success(bloque())
    } catch (e: HttpException) {
        val cuerpo = e.response()?.errorBody()?.string()
        Result.failure(ApiException(Mapeadores.mensajeDeError(e.code(), cuerpo), e.code()))
    } catch (e: IOException) {
        Result.failure(ApiException("No se pudo conectar con el servidor. Revisa tu conexión."))
    } catch (e: ApiException) {
        Result.failure(e)
    }

    suspend fun iniciarSesion(correo: String, clave: String): Result<Sesion> = llamar {
        val respuesta = api.login(LoginRequest(correo.trim(), clave))
        Mapeadores.sesion(respuesta) ?: throw ApiException("Respuesta de login incompleta")
    }

    suspend fun obtenerMesas(): Result<List<Mesa>> = llamar {
        // distinctBy: la vista puede repetir una mesa si quedó con dos pedidos abiertos.
        api.mesas().mapNotNull(Mapeadores::mesa).distinctBy { it.id }
    }

    suspend fun obtenerProductos(): Result<List<Producto>> = llamar {
        api.productos().mapNotNull(Mapeadores::producto)
    }

    /** Pedidos abiertos con sus productos (un GET de detalle por pedido, en paralelo). */
    suspend fun obtenerPedidosActivos(): Result<List<Pedido>> = llamar {
        val activos = api.pedidosActivos()
        coroutineScope {
            activos.map { dto ->
                async {
                    val detalle = dto.idPedido?.let { api.pedido(it).detalle }.orEmpty()
                    Mapeadores.pedidoActivo(dto, detalle)
                }
            }.awaitAll().filterNotNull().sortedByDescending { it.id }
        }
    }

    /** Pedidos facturados hoy (hora de Colombia), con sus productos. */
    suspend fun obtenerHistorialDeHoy(): Result<List<Pedido>> = llamar {
        val hoy = LocalDate.now(zonaRestaurante).toString()
        val facturas = api.facturas(fechaInicio = hoy, fechaFin = hoy)
        val ahora = Instant.now()
        coroutineScope {
            facturas.map { dto ->
                async {
                    val detalle = dto.idFactura?.let { api.factura(it).detalle }.orEmpty()
                    Mapeadores.pedidoFacturado(dto, detalle, ahora)
                }
            }.awaitAll().filterNotNull()
        }
    }

    /**
     * Abre un pedido en la mesa (si no tiene uno abierto) y le agrega los
     * productos uno por uno. El backend recalcula el total con
     * sp_AgregarDetallePedido en cada inserción.
     */
    suspend fun enviarPedido(
        idMesa: Int,
        idPedidoAbierto: Int?,
        items: List<ItemNuevo>
    ): Result<PedidoEnviado> = llamar {
        if (items.isEmpty()) throw ApiException("Agrega al menos un producto")

        val idPedido = idPedidoAbierto
            ?: api.crearPedido(CrearPedidoRequest(idMesa)).idPedido
            ?: throw ApiException("El servidor no devolvió el número de pedido")

        var agregados = 0
        for (item in items) {
            try {
                api.agregarProducto(idPedido, AgregarProductoRequest(item.idProducto, item.cantidad))
                agregados++
            } catch (e: HttpException) {
                val cuerpo = e.response()?.errorBody()?.string()
                val motivo = Mapeadores.mensajeDeError(e.code(), cuerpo)
                // Si algo falló a mitad de camino, se informa qué quedó guardado.
                val parcial = if (agregados > 0) {
                    "Se guardaron $agregados de ${items.size} productos en el pedido #$idPedido. "
                } else ""
                throw ApiException(parcial + motivo, e.code())
            }
        }
        PedidoEnviado(idPedido, items.sumOf { it.cantidad })
    }
}
