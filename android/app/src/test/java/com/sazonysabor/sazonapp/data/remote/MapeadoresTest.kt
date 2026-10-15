package com.sazonysabor.sazonapp.data.remote

import com.google.gson.Gson
import com.sazonysabor.sazonapp.data.model.EstadoMesa
import com.sazonysabor.sazonapp.data.model.EstadoPedido
import com.sazonysabor.sazonapp.data.remote.dto.FacturaDto
import com.sazonysabor.sazonapp.data.remote.dto.LoginResponse
import com.sazonysabor.sazonapp.data.remote.dto.MesaDto
import com.sazonysabor.sazonapp.data.remote.dto.PedidoActivoDto
import com.sazonysabor.sazonapp.data.remote.dto.PedidoConDetalleDto
import com.sazonysabor.sazonapp.data.remote.dto.ProductoDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

/**
 * Verifica que el JSON tal como lo produce el backend (Express + mysql2)
 * se convierte bien a los modelos de la app.
 */
class MapeadoresTest {

    private val gson = Gson()

    @Test
    fun login_convierteTokenYUsuario() {
        val json = """{"token":"abc.def.ghi","usuario":{"id_usuario":2,"nombre":"Cajero Turno Mañana",
            "email":"cajero@sazonysabor.co","rol":"cajero"}}"""
        val sesion = Mapeadores.sesion(gson.fromJson(json, LoginResponse::class.java))!!
        assertEquals("abc.def.ghi", sesion.token)
        assertEquals(2, sesion.usuario.id)
        assertEquals("cajero", sesion.usuario.rol)
    }

    @Test
    fun login_sinToken_devuelveNull() {
        assertNull(Mapeadores.sesion(gson.fromJson("""{"usuario":null}""", LoginResponse::class.java)))
    }

    @Test
    fun mesaOcupada_tomaPedidoYTotalDecimalComoTexto() {
        // mysql2 envía DECIMAL como string
        val json = """{"id_mesa":4,"numero":4,"capacidad":4,"ubicacion":"Interior","estado":"ocupada",
            "id_pedido":58,"total_pedido":"36000.00","minutos_pedido_abierto":17}"""
        val mesa = Mapeadores.mesa(gson.fromJson(json, MesaDto::class.java))!!
        assertEquals(EstadoMesa.OCUPADA, mesa.estado)
        assertEquals(58, mesa.idPedido)
        assertEquals(36000, mesa.totalCuenta)
        assertEquals(17, mesa.minutosAbierta)
    }

    @Test
    fun mesaDisponible_ignoraDatosDePedido() {
        val json = """{"id_mesa":1,"numero":1,"capacidad":2,"ubicacion":null,"estado":"disponible",
            "id_pedido":null,"total_pedido":null,"minutos_pedido_abierto":null}"""
        val mesa = Mapeadores.mesa(gson.fromJson(json, MesaDto::class.java))!!
        assertEquals(EstadoMesa.DISPONIBLE, mesa.estado)
        assertNull(mesa.idPedido)
        assertEquals(0, mesa.totalCuenta)
        assertEquals("", mesa.ubicacion)
    }

    @Test
    fun producto_disponibleLlegaComoCeroOUno() {
        val agotado = """{"id_producto":12,"id_categoria":7,"nombre":"Dulce de papayuela","descripcion":null,
            "precio":"6000.00","disponible":0,"categoria":"Otros"}"""
        val p = Mapeadores.producto(gson.fromJson(agotado, ProductoDto::class.java))!!
        assertFalse(p.disponible)
        assertEquals(6000, p.precio)
        assertEquals("", p.descripcion)

        val disponible = agotado.replace("\"disponible\":0", "\"disponible\":1")
        assertTrue(Mapeadores.producto(gson.fromJson(disponible, ProductoDto::class.java))!!.disponible)
    }

    @Test
    fun categorias_sinRepetirYEnOrden() {
        val productos = listOf("Bebidas", "Empanadas", "Bebidas", "Otros").mapIndexed { i, c ->
            Mapeadores.producto(ProductoDto(i + 1, null, "P$i", null, 1000.0, 1, c))!!
        }
        assertEquals(listOf("Bebidas", "Empanadas", "Otros"), Mapeadores.categorias(productos))
    }

    @Test
    fun pedidoActivo_incluyeLineasDelDetalle() {
        val activo = gson.fromJson(
            """{"id_pedido":7,"numero_mesa":3,"atendido_por":"Ana","minutos_abierto":5,"total":"24000.00"}""",
            PedidoActivoDto::class.java
        )
        val detalle = gson.fromJson(
            """{"pedido":{"id_pedido":7},"detalle":[{"id_detalle":1,"producto":"Ajiaco","cantidad":2,
               "precio_unitario":"12000.00","subtotal":"24000.00"}]}""",
            PedidoConDetalleDto::class.java
        ).detalle!!

        val pedido = Mapeadores.pedidoActivo(activo, detalle)!!
        assertEquals("#007", pedido.codigo)
        assertEquals(EstadoPedido.ABIERTO, pedido.estado)
        assertEquals(24000, pedido.total)
        assertEquals(1, pedido.lineas.size)
        assertEquals("Ajiaco", pedido.lineas[0].producto)
        assertEquals("Atiende: Ana", pedido.nota)
    }

    @Test
    fun pedidoFacturado_calculaMinutosDesdeFechaIso() {
        val factura = gson.fromJson(
            """{"id_factura":3,"id_pedido":12,"numero_factura":"FAC-000012","numero_mesa":5,
               "fecha_hora":"2026-10-15T20:00:00.000Z","total":"18000.00","medio_pago":"efectivo","cobrado_por":"Admin"}""",
            FacturaDto::class.java
        )
        val pedido = Mapeadores.pedidoFacturado(factura, emptyList(), Instant.parse("2026-10-15T20:45:00Z"))!!
        assertEquals("FAC-000012", pedido.codigo)
        assertEquals(EstadoPedido.FACTURADO, pedido.estado)
        assertEquals(45, pedido.minutos)
        assertEquals("Efectivo · cobró Admin", pedido.nota)
    }

    @Test
    fun minutosDesde_fechaInvalida_devuelveNull() {
        assertNull(Mapeadores.minutosDesde("no-es-fecha", Instant.now()))
        assertNull(Mapeadores.minutosDesde(null, Instant.now()))
    }

    @Test
    fun mensajeDeError_usaElTextoDelBackend() {
        assertEquals(
            "La mesa no está disponible para crear un pedido",
            Mapeadores.mensajeDeError(400, """{"error":"La mesa no está disponible para crear un pedido"}""")
        )
    }

    @Test
    fun mensajeDeError_sinCuerpo_usaMensajePorCodigo() {
        assertEquals("Tu sesión expiró. Vuelve a iniciar sesión", Mapeadores.mensajeDeError(401, null))
        assertEquals("El servidor tuvo un problema. Intenta de nuevo", Mapeadores.mensajeDeError(502, "<html>"))
    }
}
