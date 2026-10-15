package com.sazonysabor.sazonapp.data.model

/** Usuario autenticado. El rol viene del JWT del backend (administrador / cajero / mesero). */
data class Usuario(
    val id: Int,
    val nombre: String,
    val correo: String,
    val rol: String
)

/** Resultado del login: token JWT + datos del usuario. */
data class Sesion(
    val token: String,
    val usuario: Usuario
)

/** Mismos valores que el ENUM `mesa.estado` de la base de datos. */
enum class EstadoMesa(val valorApi: String, val etiqueta: String) {
    DISPONIBLE("disponible", "Disponible"),
    OCUPADA("ocupada", "Ocupada"),
    RESERVADA("reservada", "Reservada");

    companion object {
        fun desdeApi(valor: String?): EstadoMesa =
            values().firstOrNull { it.valorApi.equals(valor, ignoreCase = true) } ?: DISPONIBLE
    }
}

data class Mesa(
    val id: Int,
    val numero: Int,
    val capacidad: Int,
    val ubicacion: String,
    val estado: EstadoMesa,
    /** Pedido abierto de la mesa (solo si está ocupada). */
    val idPedido: Int? = null,
    val totalCuenta: Int = 0,
    val minutosAbierta: Int? = null
)

data class Producto(
    val id: Int,
    val nombre: String,
    val descripcion: String,
    val precio: Int,
    /** Nombre de la categoría tal como está en la tabla `categoria`. */
    val categoria: String,
    val disponible: Boolean = true
)

/** Mismos valores que el ENUM `pedido.estado` de la base de datos. */
enum class EstadoPedido(val valorApi: String, val etiqueta: String) {
    ABIERTO("abierto", "Abierto"),
    CERRADO("cerrado", "Cerrado"),
    FACTURADO("facturado", "Facturado");

    companion object {
        fun desdeApi(valor: String?): EstadoPedido =
            values().firstOrNull { it.valorApi.equals(valor, ignoreCase = true) } ?: ABIERTO
    }
}

data class LineaPedido(
    val producto: String,
    val cantidad: Int,
    val subtotal: Int
)

/**
 * Un pedido tal como lo muestra la app. Sirve para los pedidos abiertos
 * (vista_pedidos_activos) y para el historial (facturas del día).
 */
data class Pedido(
    val id: Int,
    /** "#012" para pedidos abiertos, "FAC-000012" para facturados. */
    val codigo: String,
    val mesaNumero: Int,
    val lineas: List<LineaPedido>,
    val estado: EstadoPedido,
    val minutos: Int?,
    val total: Int,
    /** Texto secundario: quién atiende o cómo se pagó. */
    val nota: String = ""
)
