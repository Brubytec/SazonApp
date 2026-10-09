package com.sazonysabor.sazonapp.data.model

object Constantes {
    const val IMPUESTO_CONSUMO = 0.08
    const val PROPINA_SUGERIDA = 0.10
}

data class Usuario(
    val nombre: String,
    val correo: String
)

enum class EstadoMesa(val etiqueta: String) {
    DISPONIBLE("Disponible"),
    OCUPADA("Ocupada"),
    RESERVADA("Reservada")
}

data class Mesa(
    val numero: Int,
    val capacidad: Int,
    val estado: EstadoMesa,
    val totalCuenta: Int = 0,
    val ocupadaDesdeMs: Long? = null
)

enum class CategoriaProducto(val etiqueta: String) {
    ENTRADAS("Entradas"),
    PLATOS_FUERTES("Platos fuertes"),
    BEBIDAS("Bebidas"),
    POSTRES("Postres"),
    ACOMPANAMIENTOS("Acompañamientos")
}

data class Producto(
    val id: Int,
    val nombre: String,
    val descripcion: String,
    val precio: Int,
    val categoria: CategoriaProducto,
    val disponible: Boolean = true
)

data class ItemPedido(
    val producto: Producto,
    val cantidad: Int
) {
    val subtotal: Int get() = producto.precio * cantidad
}

enum class EstadoPedido(val etiqueta: String) {
    NUEVO("Nuevo"),
    EN_PREPARACION("En preparación"),
    LISTO("Listo"),
    ENTREGADO("Entregado")
}

data class Pedido(
    val id: Int,
    val numero: Int,
    val mesaNumero: Int,
    val items: List<ItemPedido>,
    val observaciones: String,
    val estado: EstadoPedido,
    val creadoMs: Long,
    val cuentaCerrada: Boolean = false
) {
    val subtotal: Int get() = items.sumOf { it.subtotal }
}