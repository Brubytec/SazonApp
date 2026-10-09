package com.sazonysabor.sazonapp.util

import android.content.res.ColorStateList
import android.widget.TextView
import androidx.annotation.ColorRes
import androidx.core.content.ContextCompat
import com.sazonysabor.sazonapp.R
import com.sazonysabor.sazonapp.data.model.EstadoMesa
import com.sazonysabor.sazonapp.data.model.EstadoPedido

object Estilos {

    private fun aplicar(vista: TextView, texto: String, @ColorRes fondo: Int, @ColorRes color: Int) {
        val contexto = vista.context
        vista.text = texto
        vista.setTextColor(ContextCompat.getColor(contexto, color))
        vista.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(contexto, fondo))
    }

    fun badge(vista: TextView, estado: EstadoMesa) {
        when (estado) {
            EstadoMesa.DISPONIBLE -> aplicar(vista, estado.etiqueta, R.color.verde_suave, R.color.verde)
            EstadoMesa.OCUPADA -> aplicar(vista, estado.etiqueta, R.color.rojo_suave, R.color.rojo)
            EstadoMesa.RESERVADA -> aplicar(vista, estado.etiqueta, R.color.ambar_suave, R.color.ambar)
        }
    }

    fun badge(vista: TextView, estado: EstadoPedido) {
        when (estado) {
            EstadoPedido.NUEVO -> aplicar(vista, estado.etiqueta, R.color.azul_suave, R.color.azul)
            EstadoPedido.EN_PREPARACION -> aplicar(vista, estado.etiqueta, R.color.ambar_suave, R.color.ambar)
            EstadoPedido.LISTO -> aplicar(vista, estado.etiqueta, R.color.verde_suave, R.color.verde)
            EstadoPedido.ENTREGADO -> aplicar(vista, estado.etiqueta, R.color.gris_suave, R.color.gris)
        }
    }
}