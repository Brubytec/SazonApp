package com.sazonysabor.sazonapp.data.remote

import com.sazonysabor.sazonapp.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/** Agrega "Authorization: Bearer <token>" a cada petición si hay sesión. */
class AuthInterceptor(private val obtenerToken: () -> String?) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = obtenerToken()
        val peticion = if (token.isNullOrBlank()) {
            chain.request()
        } else {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }
        return chain.proceed(peticion)
    }
}

object ApiClient {

    fun crear(obtenerToken: () -> String?, urlBase: String = BuildConfig.API_BASE_URL): ApiService {
        val log = HttpLoggingInterceptor().apply {
            // En debug se ve cada petición en Logcat (filtro "okhttp"). Nunca en release.
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
            else HttpLoggingInterceptor.Level.NONE
            redactHeader("Authorization")
        }

        val cliente = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(obtenerToken))
            .addInterceptor(log)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(urlBase)
            .client(cliente)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
