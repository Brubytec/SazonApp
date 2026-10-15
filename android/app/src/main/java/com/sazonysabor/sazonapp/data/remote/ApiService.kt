package com.sazonysabor.sazonapp.data.remote

import com.sazonysabor.sazonapp.data.remote.dto.AgregarProductoRequest
import com.sazonysabor.sazonapp.data.remote.dto.CrearPedidoRequest
import com.sazonysabor.sazonapp.data.remote.dto.DetallePedidoDto
import com.sazonysabor.sazonapp.data.remote.dto.FacturaConDetalleDto
import com.sazonysabor.sazonapp.data.remote.dto.FacturaDto
import com.sazonysabor.sazonapp.data.remote.dto.LoginRequest
import com.sazonysabor.sazonapp.data.remote.dto.LoginResponse
import com.sazonysabor.sazonapp.data.remote.dto.MesaDto
import com.sazonysabor.sazonapp.data.remote.dto.PedidoActivoDto
import com.sazonysabor.sazonapp.data.remote.dto.PedidoConDetalleDto
import com.sazonysabor.sazonapp.data.remote.dto.PedidoDto
import com.sazonysabor.sazonapp.data.remote.dto.ProductoDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Rutas del backend (backend/src/routes). La URL base termina en "/api/",
 * por eso aquí van sin "/" inicial. Todas, menos el login, exigen el header
 * Authorization: Bearer <token>, que agrega AuthInterceptor.
 */
interface ApiService {

    // authRoutes.js
    @POST("auth/login")
    suspend fun login(@Body cuerpo: LoginRequest): LoginResponse

    // mesaRoutes.js → vista_estado_mesas
    @GET("mesas")
    suspend fun mesas(): List<MesaDto>

    // productoRoutes.js (sin filtro: incluye los no disponibles para mostrarlos "Agotado")
    @GET("productos")
    suspend fun productos(): List<ProductoDto>

    // pedidoRoutes.js
    @GET("pedidos/activos")
    suspend fun pedidosActivos(): List<PedidoActivoDto>

    @GET("pedidos/{id}")
    suspend fun pedido(@Path("id") idPedido: Int): PedidoConDetalleDto

    /** Llama sp_CrearPedido: valida que la mesa esté disponible y la marca ocupada. */
    @POST("pedidos")
    suspend fun crearPedido(@Body cuerpo: CrearPedidoRequest): PedidoDto

    /** Llama sp_AgregarDetallePedido y devuelve el detalle completo del pedido. */
    @POST("pedidos/{id}/productos")
    suspend fun agregarProducto(
        @Path("id") idPedido: Int,
        @Body cuerpo: AgregarProductoRequest
    ): List<DetallePedidoDto>

    // facturaRoutes.js (historial del día)
    @GET("facturas")
    suspend fun facturas(
        @Query("fechaInicio") fechaInicio: String,
        @Query("fechaFin") fechaFin: String
    ): List<FacturaDto>

    @GET("facturas/{id}")
    suspend fun factura(@Path("id") idFactura: Int): FacturaConDetalleDto
}
