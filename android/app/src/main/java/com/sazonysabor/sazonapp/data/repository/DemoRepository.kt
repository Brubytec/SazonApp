package com.sazonysabor.sazonapp.data.repository

import com.sazonysabor.sazonapp.data.model.CategoriaProducto
import com.sazonysabor.sazonapp.data.model.Constantes
import com.sazonysabor.sazonapp.data.model.EstadoMesa
import com.sazonysabor.sazonapp.data.model.EstadoPedido
import com.sazonysabor.sazonapp.data.model.ItemPedido
import com.sazonysabor.sazonapp.data.model.Mesa
import com.sazonysabor.sazonapp.data.model.Pedido
import com.sazonysabor.sazonapp.data.model.Producto
import com.sazonysabor.sazonapp.data.model.Usuario
import kotlin.math.roundToInt

/**
 * Repositorio DEMO: guarda todo en memoria para poder probar las pantallas
 * sin backend. Más adelante se reemplaza por Retrofit conservando estas
 * mismas funciones.
 */
object DemoRepository {

    private val usuarioDemo = Usuario("Juan Carlos Pino", "juan.carlos@sazon.com")
    private const val CLAVE_DEMO = "Mesero123*"

    private class MesaBase(val numero: Int, val capacidad: Int, val reservada: Boolean)

    private val mesasBase = listOf(
        MesaBase(1, 4, false),
        MesaBase(2, 6, false),
        MesaBase(3, 2, true),
        MesaBase(4, 4, false),
        MesaBase(5, 4, false),
        MesaBase(6, 8, false),
        MesaBase(7, 6, false),
        MesaBase(8, 4, false),
        MesaBase(9, 2, true),
        MesaBase(10, 4, false)
    )

    private val productos = listOf(
        Producto(1, "Empanadas de Pipián x6", "Típicas de Popayán acompañadas de ají de maní.", 6000, CategoriaProducto.ENTRADAS),
        Producto(2, "Sopa de Carantanta", "Caldo tradicional con trozos crocantes de maíz.", 12000, CategoriaProducto.ENTRADAS),
        Producto(3, "Tamal de Pipián", "Masa de papa colorada y ají envuelto en hoja.", 7000, CategoriaProducto.ENTRADAS),
        Producto(4, "Carantanta con hogao", "Porción de carantanta crujiente con hogao.", 8000, CategoriaProducto.ENTRADAS),
        Producto(5, "Aborrajados", "Plátano maduro relleno de queso y bocadillo.", 5000, CategoriaProducto.ENTRADAS),
        Producto(6, "Tripaso o Ternero", "Guiso típico payanés con carnes selectas.", 22000, CategoriaProducto.PLATOS_FUERTES),
        Producto(7, "Mote de Queso", "Con queso costeño y hogao.", 18000, CategoriaProducto.PLATOS_FUERTES),
        Producto(8, "Champús", "Refrescante bebida de maíz con piña y lulo.", 6000, CategoriaProducto.BEBIDAS),
        Producto(9, "Lulada Payanesa", "Bebida fría de lulo macerado con hielo.", 5500, CategoriaProducto.BEBIDAS),
        Producto(10, "Jugo natural", "Maracuyá, mora o lulo, en agua o en leche.", 5000, CategoriaProducto.BEBIDAS),
        Producto(11, "Helado de paila", "Helado artesanal de mora preparado en paila.", 6500, CategoriaProducto.POSTRES),
        Producto(12, "Dulce de papayuela", "Dulce tradicional payanés con queso.", 6000, CategoriaProducto.POSTRES, disponible = false),
        Producto(13, "Arroz blanco", "Porción individual de arroz.", 3500, CategoriaProducto.ACOMPANAMIENTOS),
        Producto(14, "Ensalada fresca", "Lechuga, tomate y cebolla con limón.", 4500, CategoriaProducto.ACOMPANAMIENTOS)
    )

    private fun hace(minutos: Int): Long = System.currentTimeMillis() - minutos * 60_000L

    private fun item(idProducto: Int, cantidad: Int) =
        ItemPedido(productos.first { it.id == idProducto }, cantidad)

    private var siguienteId = 100
    private var siguienteNumero = 23

    private val pedidos = mutableListOf(
        Pedido(17, 17, 6, listOf(item(6, 2), item(8, 2)), "", EstadoPedido.ENTREGADO, hace(130), cuentaCerrada = true),
        Pedido(18, 18, 4, listOf(item(2, 1), item(7, 1), item(9, 2)), "", EstadoPedido.ENTREGADO, hace(95), cuentaCerrada = true),
        Pedido(19, 19, 2, listOf(item(6, 2), item(7, 2)), "", EstadoPedido.ENTREGADO, hace(45)),
        Pedido(20, 20, 2, listOf(item(2, 2), item(8, 2), item(4, 1)), "Sin picante.", EstadoPedido.LISTO, hace(15)),
        Pedido(21, 21, 8, listOf(item(6, 2), item(5, 1), item(9, 1)), "", EstadoPedido.EN_PREPARACION, hace(12)),
        Pedido(22, 22, 5, listOf(item(1, 2), item(7, 1), item(4, 1), item(9, 3)), "Sin cebolla en el hogao.", EstadoPedido.NUEVO, hace(2))
    )

    fun iniciarSesion(correo: String, clave: String): Usuario? =
        if (correo.trim().equals(usuarioDemo.correo, ignoreCase = true) && clave == CLAVE_DEMO) {
            usuarioDemo
        } else {
            null
        }

    fun obtenerProductos(): List<Producto> = productos

    fun obtenerMesas(): List<Mesa> = mesasBase.map { base ->
        val abiertos = pedidos.filter { it.mesaNumero == base.numero && !it.cuentaCerrada }
        when {
            abiertos.isNotEmpty() -> Mesa(
                numero = base.numero,
                capacidad = base.capacidad,
                estado = EstadoMesa.OCUPADA,
                totalCuenta = abiertos.sumOf { it.subtotal },
                ocupadaDesdeMs = abiertos.minOf { it.creadoMs }
            )
            base.reservada -> Mesa(base.numero, base.capacidad, EstadoMesa.RESERVADA)
            else -> Mesa(base.numero, base.capacidad, EstadoMesa.DISPONIBLE)
        }
    }

    fun obtenerPedidosActivos(): List<Pedido> =
        pedidos.filter { it.estado != EstadoPedido.ENTREGADO }.sortedByDescending { it.creadoMs }

    fun obtenerHistorial(): List<Pedido> =
        pedidos.filter { it.estado == EstadoPedido.ENTREGADO }.sortedByDescending { it.creadoMs }

    fun crearPedido(mesaNumero: Int, items: List<ItemPedido>, observaciones: String): Pedido {
        val pedido = Pedido(
            id = siguienteId++,
            numero = siguienteNumero++,
            mesaNumero = mesaNumero,
            items = items,
            observaciones = observaciones,
            estado = EstadoPedido.NUEVO,
            creadoMs = System.currentTimeMillis()
        )
        pedidos.add(pedido)
        return pedido
    }

    fun avanzarEstado(idPedido: Int) {
        val posicion = pedidos.indexOfFirst { it.id == idPedido }
        if (posicion < 0) return
        val actual = pedidos[posicion]
        val siguiente = when (actual.estado) {
            EstadoPedido.NUEVO -> EstadoPedido.EN_PREPARACION
            EstadoPedido.EN_PREPARACION -> EstadoPedido.LISTO
            EstadoPedido.LISTO -> EstadoPedido.ENTREGADO
            EstadoPedido.ENTREGADO -> EstadoPedido.ENTREGADO
        }
        pedidos[posicion] = actual.copy(estado = siguiente)
    }

    fun propinaDelDia(): Int =
        (pedidos.sumOf { it.subtotal } * Constantes.PROPINA_SUGERIDA).roundToInt()
}