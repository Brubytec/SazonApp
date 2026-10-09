package com.sazonysabor.sazonapp.ui.main

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.sazonysabor.sazonapp.R
import com.sazonysabor.sazonapp.databinding.ActivityMainBinding
import com.sazonysabor.sazonapp.ui.mesas.MesasFragment
import com.sazonysabor.sazonapp.ui.pedidos.PedidosFragment
import com.sazonysabor.sazonapp.util.configurarBarras

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configurarBarras()
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.bottomNav.setOnItemSelectedListener { opcion ->
            val fragmento: Fragment = when (opcion.itemId) {
                R.id.nav_mesas -> MesasFragment()
                R.id.nav_pedidos -> PedidosFragment.nuevo(historial = false)
                else -> PedidosFragment.nuevo(historial = true)
            }
            supportFragmentManager.beginTransaction()
                .replace(R.id.contenedor, fragmento)
                .commit()
            true
        }

        if (savedInstanceState == null) {
            binding.bottomNav.selectedItemId = R.id.nav_mesas
        }
    }
}