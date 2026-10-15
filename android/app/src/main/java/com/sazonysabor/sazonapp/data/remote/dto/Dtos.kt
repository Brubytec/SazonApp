package com.sazonysabor.sazonapp.data.remote.dto

import com.google.gson.annotations.SerializedName

/*
 * DTO = forma exacta del JSON que devuelve el backend (snake_case).
 * Todos los campos son anulables porque Gson no respeta la nulabilidad de
 * Kotlin: si el backend omite un campo, quedaría null aunque el tipo diga lo
 * contrario. La conversión segura a modelos se hace en Mapeadores.kt.
 *
 * Notas sobre mysql2:
 *  - DECIMAL llega como texto ("18000.00"); Gson lo convierte a Double.
 *  - BOOLEAN (TINYINT) llega como 0/1, por eso `disponible` es Int.
 *  - DATETIME llega como ISO-8601 en UTC ("2026-10-15T21:30:00.000Z").
 */

// ── Auth ──────────────────────────────────────────────────────
data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("token") val token: String?,
    @SerializedName("usuario") val usuario: UsuarioDto?
)

data class UsuarioDto(
    @SerializedName("id_usuario") val idUsuario: Int?,
    @SerializedName("nombre") val nombre: String?,
    @SerializedName("email") val email: String?,
    @SerializedName("rol") val rol: String?
)

// ── Mesas (vista_estado_mesas) ────────────────────────────────
data class MesaDto(
    @SerializedName("id_mesa") val idMesa: Int?,
    @SerializedName("numero") val numero: Int?,
    @SerializedName("capacidad") val capacidad: Int?,
    @SerializedName("ubicacion") val ubicacion: String?,
    @SerializedName("estado") val estado: String?,
    @SerializedName("id_pedido") val idPedido: Int?,
    @SerializedName("total_pedido") val totalPedido: Double?,
    @SerializedName("minutos_pedido_abierto") val minutosPedidoAbierto: Int?
)

// ── Productos ────────────────────────────────────────────────
data class ProductoDto(
    @SerializedName("id_producto") val idProducto: Int?,
    @SerializedName("id_categoria") val idCategoria: Int?,
    @SerializedName("nombre") val nombre: String?,
    @SerializedName("descripcion") val descripcion: String?,
    @SerializedName("precio") val precio: Double?,
    @SerializedName("disponible") val disponible: Int?,
    @SerializedName("categoria") val categoria: String?
)

// ── Pedidos ──────────────────────────────────────────────────
data class CrearPedidoRequest(
    @SerializedName("id_mesa") val idMesa: Int
)

data class AgregarProductoRequest(
    @SerializedName("id_producto") val idProducto: Int,
    @SerializedName("cantidad") val cantidad: Int
)

/** Fila de la tabla pedido (+ numero_mesa). Respuesta de POST /pedidos. */
data class PedidoDto(
    @SerializedName("id_pedido") val idPedido: Int?,
    @SerializedName("id_mesa") val idMesa: Int?,
    @SerializedName("numero_mesa") val numeroMesa: Int?,
    @SerializedName("fecha_hora") val fechaHora: String?,
    @SerializedName("estado") val estado: String?,
    @SerializedName("total") val total: Double?
)

/** Fila de vista_pedidos_activos. Respuesta de GET /pedidos/activos. */
data class PedidoActivoDto(
    @SerializedName("id_pedido") val idPedido: Int?,
    @SerializedName("numero_mesa") val numeroMesa: Int?,
    @SerializedName("ubicacion") val ubicacion: String?,
    @SerializedName("atendido_por") val atendidoPor: String?,
    @SerializedName("fecha_hora") val fechaHora: String?,
    @SerializedName("minutos_abierto") val minutosAbierto: Int?,
    @SerializedName("total") val total: Double?,
    @SerializedName("num_productos") val numProductos: Int?
)

/** Fila de vista_detalle_pedido_completo (y del detalle de factura). */
data class DetallePedidoDto(
    @SerializedName("id_detalle") val idDetalle: Int?,
    @SerializedName("id_pedido") val idPedido: Int?,
    @SerializedName("producto") val producto: String?,
    @SerializedName("categoria") val categoria: String?,
    @SerializedName("cantidad") val cantidad: Int?,
    @SerializedName("precio_unitario") val precioUnitario: Double?,
    @SerializedName("subtotal") val subtotal: Double?
)

/** Respuesta de GET /pedidos/:id → { pedido, detalle }. */
data class PedidoConDetalleDto(
    @SerializedName("pedido") val pedido: PedidoDto?,
    @SerializedName("detalle") val detalle: List<DetallePedidoDto>?
)

// ── Facturas (historial) ─────────────────────────────────────
data class FacturaDto(
    @SerializedName("id_factura") val idFactura: Int?,
    @SerializedName("id_pedido") val idPedido: Int?,
    @SerializedName("numero_factura") val numeroFactura: String?,
    @SerializedName("numero_mesa") val numeroMesa: Int?,
    @SerializedName("fecha_hora") val fechaHora: String?,
    @SerializedName("total") val total: Double?,
    @SerializedName("medio_pago") val medioPago: String?,
    @SerializedName("cobrado_por") val cobradoPor: String?
)

/** Respuesta de GET /facturas/:id → { factura, detalle }. */
data class FacturaConDetalleDto(
    @SerializedName("factura") val factura: FacturaDto?,
    @SerializedName("detalle") val detalle: List<DetallePedidoDto>?
)

// ── Errores ──────────────────────────────────────────────────
/** El backend responde los errores como { "error": "mensaje" }. */
data class ErrorDto(
    @SerializedName("error") val error: String?
)
