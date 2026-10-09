package com.sazonysabor.sazonapp.util

import android.graphics.Color
import android.view.View
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import kotlin.math.max

/** Pantalla de borde a borde con íconos claros en la barra de estado (fondo morado). */
fun ComponentActivity.configurarBarras() {
    enableEdgeToEdge(statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT))
}

/** Suma al padding superior el alto de la barra de estado. */
fun View.aplicarInsetSuperior() {
    val base = paddingTop
    ViewCompat.setOnApplyWindowInsetsListener(this) { vista, insets ->
        val barras = insets.getInsets(
            WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
        )
        vista.updatePadding(top = base + barras.top)
        insets
    }
    ViewCompat.requestApplyInsets(this)
}

/** Suma al padding inferior la barra de navegación o el teclado (lo que sea mayor). */
fun View.aplicarInsetInferior() {
    val base = paddingBottom
    ViewCompat.setOnApplyWindowInsetsListener(this) { vista, insets ->
        val barras = insets.getInsets(
            WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
        )
        val teclado = insets.getInsets(WindowInsetsCompat.Type.ime())
        vista.updatePadding(bottom = base + max(barras.bottom, teclado.bottom))
        insets
    }
    ViewCompat.requestApplyInsets(this)
}

/** Superior + inferior (con teclado). Se usa en el login. */
fun View.aplicarInsetsCompletos() {
    val baseArriba = paddingTop
    val baseAbajo = paddingBottom
    ViewCompat.setOnApplyWindowInsetsListener(this) { vista, insets ->
        val barras = insets.getInsets(
            WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
        )
        val teclado = insets.getInsets(WindowInsetsCompat.Type.ime())
        vista.updatePadding(
            top = baseArriba + barras.top,
            bottom = baseAbajo + max(barras.bottom, teclado.bottom)
        )
        insets
    }
    ViewCompat.requestApplyInsets(this)
}