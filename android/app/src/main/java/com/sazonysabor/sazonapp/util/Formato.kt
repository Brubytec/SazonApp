package com.sazonysabor.sazonapp.util

import java.util.Locale

object Formato {

    /** 12000 -> "$12,000" */
    fun moneda(valor: Int): String = "\$" + String.format(Locale.US, "%,d", valor)

    /** 75 -> "Hace 1 h 15 min" */
    fun hace(minutos: Int?): String {
        if (minutos == null) return ""
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
