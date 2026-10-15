# SazonApp Android (mesero)

App Kotlin + MVVM que consume la API REST del backend (`backend/`).

## Cómo correrla contra el backend local

1. Levantar la API: `cd backend && npm install && npm start` (queda en `http://localhost:3001`).
2. Abrir la carpeta `android/` en Android Studio y sincronizar Gradle.
3. Ejecutar en un emulador (API 26+). En el emulador, `10.0.2.2` apunta al `localhost` del PC.
4. Iniciar sesión con un usuario que exista en la tabla `usuario` (contraseña con bcrypt).

Para un celular físico en la misma red WiFi, poner la IP del PC en `gradle.properties`
(y agregarla en `res/xml/network_security_config.xml`):

```
SAZON_API_URL_DEBUG=http://192.168.1.50:3001/api/
```

El build `release` apunta a `SAZON_API_URL_RELEASE` (por defecto el VPS).

## Rutas que usa la app

| Pantalla | Método y ruta | Fuente en el backend |
|---|---|---|
| Login | `POST /api/auth/login` | `authRoutes.js` |
| Mesas | `GET /api/mesas` | `vista_estado_mesas` |
| Nuevo pedido (catálogo) | `GET /api/productos` | `productoRoutes.js` |
| Nuevo pedido (mesa libre) | `POST /api/pedidos` `{ id_mesa }` | `sp_CrearPedido` |
| Agregar productos | `POST /api/pedidos/:id/productos` `{ id_producto, cantidad }` | `sp_AgregarDetallePedido` |
| Pedidos activos | `GET /api/pedidos/activos` + `GET /api/pedidos/:id` | `vista_pedidos_activos`, `vista_detalle_pedido_completo` |
| Historial | `GET /api/facturas?fechaInicio=&fechaFin=` + `GET /api/facturas/:id` | `facturaRoutes.js` |

Todas, menos el login, envían `Authorization: Bearer <token>`. Un 401 cierra la sesión y vuelve al login.

## Estructura

```
data/
  local/        SesionManager (token JWT y usuario)
  model/        modelos de dominio que usa la UI
  remote/       ApiService (Retrofit), ApiClient, DTOs y Mapeadores
  repository/   SazonRepository: único punto de acceso a la API
di/             ServiceLocator (inyección manual)
ui/             login, mesas, nuevopedido, pedidos (View + ViewModel)
```

## Pruebas

`./gradlew testDebugUnitTest`

- `MapeadoresTest`: JSON del backend (DECIMAL como texto, BOOLEAN como 0/1, fechas ISO) → modelos.
- `SazonRepositoryTest`: con MockWebServer verifica rutas, cuerpos JSON, header Bearer y manejo de errores.
