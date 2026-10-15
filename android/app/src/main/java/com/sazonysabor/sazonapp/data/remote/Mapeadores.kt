package com.sazonysabor.sazonapp.data.remote

import com.google.gson.Gson
import com.sazonysabor.sazonapp.data.model.EstadoMesa
import com.sazonysabor.sazonapp.data.model.EstadoPedido
import com.sazonysabor.sazonapp.data.model.LineaPedido
import com.sazonysabor.sazonapp.data.model.Mesa
import com.sazonysabor.sazonapp.data.model.Pedido
import com.sazonysabor.sazonapp.data.model.Producto
import com.sazonysabor.sazonapp.data.model.Sesion
import com.sazonysabor.sazonapp.data.model.Usuario
import com.sazonysabor.sazonapp.data.remote.dto.DetallePedidoDto
import com.sazonysabor.sazonapp.data.remote.dto.ErrorDto
import com.sazonysabor.sazonapp.data.remote.dto.FacturaDto
import com.sazonysabor.sazonapp.data.remote.dto.LoginResponse
import com.sazonysabor.sazonapp.data.remote.dto.MesaDto
import com.sazonysabor.sazonapp.data.remote.dto.PedidoActivoDto
import com.sazonysabor.sazonapp.data.remote.dto.ProductoDto
import java.time.Duration
import java.time.Instant
import java.util.Locale
import kotlin.math.roundToInt

/**
 * Conversión DTO (JSON del backend) → modelos de la app.
 * Es Kotlin puro (sin clases de Android) para poder probarlo con JUnit.
 */
object Mapeadores {

    private fun pesos(valor: Double?): Int = (valor ?: 0.0).roundToInt()

    fun sesion(dto: LoginResponse): Sesion? {
        val token = dto.token ?: return null
        val u = dto.usuario ?: return null
        return Sesion(
            token = token,
            usuario = Usuario(
                id = u.idUsuario ?: 0,
                nombre = u.nombre.orEmpty(),
                correo = u.email.orEmpty(),
                rol = u.rol.orEmpty()
            )
        )
    }

    fun mesa(dto: MesaDto): Mesa? {
        val id = dto.idMesa ?: return null
        val estado = EstadoMesa.desdeApi(dto.estado)
        val ocupada = estado == EstadoMesa.OCUPADA
        return Mesa(
            id = id,
            numero = dto.numero ?: id,
            capacidad = dto.capacidad ?: 0,
            ubicacion = dto.ubicacion.orEmpty(),
            estado = estado,
            idPedido = if (ocupada) dto.idPedido else null,
            totalCuenta = if (ocupada) pesos(dto.totalPedido) else 0,
            minutosAbierta = if (ocupada) dto.minutosPedidoAbierto else null
        )
    }

    fun producto(dto: ProductoDto): Producto? {
        val id = dto.idProducto ?: return null
        return Producto(
            id = id,
            nombre = dto.nombre.orEmpty(),
            descripcion = dto.descripcion.orEmpty(),
            precio = pesos(dto.precio),
            categoria = dto.categoria ?: "Otros",
            // MySQL devuelve BOOLEAN como 0/1; si no viene, se asume disponible.
            disponible = (dto.disponible ?: 1) != 0
        )
    }

    /** Categorías en el orden en que aparecen en el menú, sin repetir. */
    fun categorias(productos: List<Producto>): List<String> =
        productos.map { it.categoria }.distinct()

    fun linea(dto: DetallePedidoDto) = LineaPedido(
        producto = dto.producto.orEmpty(),
        cantidad = dto.cantidad ?: 0,
        subtotal = pesos(dto.subtotal)
    )

    fun pedidoActivo(dto: PedidoActivoDto, detalle: List<DetallePedidoDto>): Pedido? {
        val id = dto.idPedido ?: return null
        return Pedido(
            id = id,
            codigo = String.format(Locale.US, "#%03d", id),
            mesaNumero = dto.numeroMesa ?: 0,
            lineas = detalle.map(::linea),
            estado = EstadoPedido.ABIERTO,
            minutos = dto.minutosAbierto,
            total = pesos(dto.total),
            nota = dto.atendidoPor?.let { "Atiende: $it" }.orEmpty()
        )
    }

    fun pedidoFacturado(dto: FacturaDto, detalle: List<DetallePedidoDto>, ahora: Instant): Pedido? {
        val id = dto.idPedido ?: return null
        val medio = dto.medioPago.orEmpty().replaceFirstChar { it.titlecase(Locale.getDefault()) }
        val nota = listOf(medio, dto.cobradoPor?.let { "cobró $it" })
            .filter { !it.isNullOrBlank() }
            .joinToString(" · ")
        return Pedido(
            id = id,
            codigo = dto.numeroFactura ?: String.format(Locale.US, "#%03d", id),
            mesaNumero = dto.numeroMesa ?: 0,
            lineas = detalle.map(::linea),
            estado = EstadoPedido.FACTURADO,
            minutos = minutosDesde(dto.fechaHora, ahora),
            total = pesos(dto.total),
            nota = nota
        )
    }

    /** "2026-10-15T21:30:00.000Z" → minutos transcurridos hasta [ahora]. */
    fun minutosDesde(fechaIso: String?, ahora: Instant): Int? {
        if (fechaIso.isNullOrBlank()) return null
        return try {
            Duration.between(Instant.parse(fechaIso), ahora).toMinutes().toInt().coerceAtLeast(0)
        } catch (e: Exception) {
            null
        }
    }

    /** Traduce el cuerpo { "error": "..." } del backend a un mensaje para el usuario. */
    fun mensajeDeError(codigo: Int, cuerpo: String?, gson: Gson = Gson()): String {
        val delServidor = try {
            cuerpo?.let { gson.fromJson(it, ErrorDto::class.java)?.error }
        } catch (e: Exception) {
            null
        }
        if (!delServidor.isNullOrBlank()) return delServidor
        return when (codigo) {
            400 -> "Datos inválidos"
            401 -> "Tu sesión expiró. Vuelve a iniciar sesión"
            403 -> "No tienes permiso para esta acción"
            404 -> "No se encontró el recurso solicitado"
            in 500..599 -> "El servidor tuvo un problema. Intenta de nuevo"
            else -> "Error inesperado ($codigo)"
        }
    }
}
