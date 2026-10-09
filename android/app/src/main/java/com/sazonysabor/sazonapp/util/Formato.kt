package com.sazonysabor.sazonapp.util

import com.sazonysabor.sazonapp.data.model.Constantes
import java.util.Locale
import kotlin.math.roundToInt

object Formato {

    /** 12000 -> "$12,000" */
    fun moneda(valor: Int): String = "\$" + String.format(Locale.US, "%,d", valor)

    fun impuesto(subtotal: Int): Int = (subtotal * Constantes.IMPUESTO_CONSUMO).roundToInt()

    fun hace(desdeMs: Long): String {
        val minutos = ((System.currentTimeMillis() - desdeMs) / 60_000L).toInt().coerceAtLeast(0)
        return when {
            minutos < 1 -> "Ahora"
            minutos < 60 -> "Hace $minutos min"
            else -> {
                val horas = minutos / 60
                val resto = minutos % 60
                if (resto == 0) "Hace $horas h" else "Hace $horas h $resto min"
            }
        }
    }
}