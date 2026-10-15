package com.sazonysabor.sazonapp.data.repository

import com.sazonysabor.sazonapp.data.remote.ApiClient
import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Prueba la integración con la API usando un servidor HTTP falso (MockWebServer):
 * comprueba rutas, método, cuerpo JSON y header Authorization que envía la app.
 */
class SazonRepositoryTest {

    private lateinit var servidor: MockWebServer
    private lateinit var repositorio: SazonRepository
    private var token: String? = "token-de-prueba"

    @Before
    fun preparar() {
        servidor = MockWebServer()
        servidor.start()
        val api = ApiClient.crear(obtenerToken = { token }, urlBase = servidor.url("/api/").toString())
        repositorio = SazonRepository(api)
    }

    @After
    fun cerrar() {
        servidor.shutdown()
    }

    private fun json(codigo: Int, cuerpo: String) =
        MockResponse().setResponseCode(codigo).setHeader("Content-Type", "application/json").setBody(cuerpo)

    @Test
    fun login_enviaEmailYPasswordSinToken() = runTest {
        token = null
        servidor.enqueue(json(200, """{"token":"t1","usuario":{"id_usuario":1,"nombre":"Admin","email":"a@b.co","rol":"administrador"}}"""))

        val sesion = repositorio.iniciarSesion(" a@b.co ", "clave").getOrThrow()

        val peticion = servidor.takeRequest()
        assertEquals("POST", peticion.method)
        assertEquals("/api/auth/login", peticion.path)
        assertEquals("""{"email":"a@b.co","password":"clave"}""", peticion.body.readUtf8())
        assertNull(peticion.getHeader("Authorization"))
        assertEquals("t1", sesion.token)
    }

    @Test
    fun login_credencialesMalas_devuelveMensajeDelBackend() = runTest {
        servidor.enqueue(json(401, """{"error":"Credenciales incorrectas"}"""))
        val error = repositorio.iniciarSesion("a@b.co", "x").exceptionOrNull() as ApiException
        assertEquals("Credenciales incorrectas", error.message)
    }

    @Test
    fun mesas_enviaTokenBearer() = runTest {
        servidor.enqueue(json(200, """[{"id_mesa":1,"numero":1,"capacidad":4,"estado":"disponible"}]"""))

        val mesas = repositorio.obtenerMesas().getOrThrow()

        val peticion = servidor.takeRequest()
        assertEquals("/api/mesas", peticion.path)
        assertEquals("Bearer token-de-prueba", peticion.getHeader("Authorization"))
        assertEquals(1, mesas.size)
    }

    @Test
    fun tokenVencido_marcaSesionExpirada() = runTest {
        servidor.enqueue(json(401, """{"error":"Token inválido o expirado."}"""))
        val error = repositorio.obtenerMesas().exceptionOrNull() as ApiException
        assertTrue(error.sesionExpirada)
        assertEquals("Token inválido o expirado.", error.message)
    }

    @Test
    fun enviarPedido_mesaLibre_creaPedidoYAgregaCadaProducto() = runTest {
        servidor.enqueue(json(201, """{"id_pedido":58,"id_mesa":4,"numero_mesa":4,"estado":"abierto","total":"0.00"}"""))
        servidor.enqueue(json(200, "[]"))
        servidor.enqueue(json(200, "[]"))

        val enviado = repositorio.enviarPedido(
            idMesa = 4,
            idPedidoAbierto = null,
            items = listOf(ItemNuevo(14, 2), ItemNuevo(9, 1))
        ).getOrThrow()

        val crear = servidor.takeRequest()
        assertEquals("/api/pedidos", crear.path)
        assertEquals("""{"id_mesa":4}""", crear.body.readUtf8())

        val primero = servidor.takeRequest()
        assertEquals("/api/pedidos/58/productos", primero.path)
        assertEquals("""{"id_producto":14,"cantidad":2}""", primero.body.readUtf8())

        assertEquals("/api/pedidos/58/productos", servidor.takeRequest().path)
        assertEquals(58, enviado.idPedido)
        assertEquals(3, enviado.unidades)
    }

    @Test
    fun enviarPedido_mesaOcupada_noCreaPedidoNuevo() = runTest {
        servidor.enqueue(json(200, "[]"))

        repositorio.enviarPedido(idMesa = 0, idPedidoAbierto = 21, items = listOf(ItemNuevo(3, 1))).getOrThrow()

        assertEquals("/api/pedidos/21/productos", servidor.takeRequest().path)
        assertEquals(1, servidor.requestCount)
    }

    @Test
    fun enviarPedido_falloAMitad_informaLoQueSeGuardo() = runTest {
        servidor.enqueue(json(200, "[]"))
        servidor.enqueue(json(400, """{"error":"El producto no está disponible actualmente"}"""))

        val error = repositorio.enviarPedido(
            idMesa = 0,
            idPedidoAbierto = 21,
            items = listOf(ItemNuevo(3, 1), ItemNuevo(12, 1))
        ).exceptionOrNull() as ApiException

        assertEquals(
            "Se guardaron 1 de 2 productos en el pedido #21. El producto no está disponible actualmente",
            error.message
        )
    }

    @Test
    fun pedidosActivos_traeElDetalleDeCadaPedido() = runTest {
        servidor.enqueue(json(200, """[{"id_pedido":7,"numero_mesa":3,"total":"12000.00","minutos_abierto":4}]"""))
        servidor.enqueue(json(200, """{"pedido":{"id_pedido":7},"detalle":[{"producto":"Ajiaco","cantidad":1,"subtotal":"12000.00"}]}"""))

        val pedidos = repositorio.obtenerPedidosActivos().getOrThrow()

        assertEquals("/api/pedidos/activos", servidor.takeRequest().path)
        assertEquals("/api/pedidos/7", servidor.takeRequest().path)
        assertEquals("Ajiaco", pedidos.single().lineas.single().producto)
    }
}
