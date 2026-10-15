package com.sazonysabor.sazonapp.util

import org.junit.Assert.assertEquals
import org.junit.Test

class FormatoTest {

    @Test
    fun moneda_formateaMilesConComa() {
        assertEquals("\$12,000", Formato.moneda(12000))
        assertEquals("\$124,000", Formato.moneda(124000))
    }

    @Test
    fun moneda_valorCero() {
        assertEquals("\$0", Formato.moneda(0))
    }

    @Test
    fun impuesto_calculaOchoPorCiento() {
        assertEquals(1520, Formato.impuesto(19000))
        assertEquals(2960, Formato.impuesto(37000))
    }

    @Test
    fun impuesto_redondeaAlEnteroMasCercano() {
        assertEquals(988, Formato.impuesto(12345))
    }

    @Test
    fun impuesto_sinConsumoEsCero() {
        assertEquals(0, Formato.impuesto(0))
    }

    @Test
    fun hace_menosDeUnMinutoEsAhora() {
        assertEquals("Ahora", Formato.hace(System.currentTimeMillis()))
    }

    @Test
    fun hace_minutos() {
        assertEquals("Hace 5 min", Formato.hace(System.currentTimeMillis() - 5 * 60_000L))
    }

    @Test
    fun hace_horasYMinutos() {
        assertEquals("Hace 1 h 30 min", Formato.hace(System.currentTimeMillis() - 90 * 60_000L))
        assertEquals("Hace 2 h", Formato.hace(System.currentTimeMillis() - 120 * 60_000L))
    }
}