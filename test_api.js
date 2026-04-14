#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════
 *  SazonApp — Suite de Pruebas de API
 *  Ejecutar: node test_api.js
 *  Requiere: backend corriendo en localhost:3001
 * ════════════════════════════════════════════════════════════════
 */

const BASE = 'http://localhost:3001/api'
const HOY  = new Date().toISOString().split('T')[0]

// ── Credenciales de prueba ────────────────────────────────────
const CRED_ADMIN  = { email: 'admin@sazonysabor.co',  password: 'Admin2026!' }
const CRED_CAJERO = { email: 'cajero@sazonysabor.co', password: 'Cajero2026!' }

// ── Colores ANSI para consola ─────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
  bgGreen:'\x1b[42m',
  bgRed:  '\x1b[41m',
  magenta:'\x1b[35m',
}

// ── Variables de estado compartidas entre tests ───────────────
let TOKEN      = null
let ID_MESA_LIBRE     = null   // mesa disponible para abrir pedido
let ID_PEDIDO_TEST    = null   // pedido creado en los tests
let ID_DETALLE_TEST   = null   // detalle agregado al pedido
let ID_PRODUCTO_TEST  = null   // producto creado en los tests
let ID_RESERVA_TEST   = null   // reserva creada en los tests
let ID_MESA_RESERVA   = null   // mesa para la reserva

// ── Resultado global ──────────────────────────────────────────
const resultados = []

// ── Helper: request ───────────────────────────────────────────
async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const opts = { method, headers }
  if (body)  opts.body = JSON.stringify(body)
  try {
    const res  = await fetch(`${BASE}${path}`, opts)
    let data
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) data = await res.json()
    else data = await res.text()
    return { status: res.status, data, ok: res.ok }
  } catch(e) {
    return { status: 0, data: null, error: e.message, ok: false }
  }
}

// ── Helper: registrar resultado ───────────────────────────────
function registrar(id, modulo, descripcion, r, expectedStatus, validacion) {
  const pasaHttp = r.status === expectedStatus
  const pasaVal  = validacion ? validacion(r.data) : true
  const pass     = pasaHttp && pasaVal && r.status !== 0

  const icono    = pass ? `${C.green}✓ PASS${C.reset}` : `${C.red}✗ FAIL${C.reset}`
  const statusC  = pass ? C.green : C.red

  const obs = r.status === 0
    ? `❌ Sin conexión: ${r.error}`
    : !pasaHttp
      ? `HTTP ${r.status} (esperado ${expectedStatus})`
      : !pasaVal
        ? `Datos inesperados: ${JSON.stringify(r.data).slice(0,120)}`
        : `HTTP ${r.status} OK`

  resultados.push({ id, modulo, descripcion, pass, status: r.status, expected: expectedStatus, obs, data: r.data })

  const pad = (s, n) => String(s).padEnd(n)
  console.log(
    `  ${icono}  ${C.bold}${pad(id,8)}${C.reset}` +
    `${C.cyan}${pad(modulo,14)}${C.reset}` +
    `${pad(descripcion,52)}` +
    `${statusC}[${r.status}]${C.reset}  ${C.gray}${obs}${C.reset}`
  )

  return pass
}

// ════════════════════════════════════════════════════════════════
//  GRUPOS DE TESTS
// ════════════════════════════════════════════════════════════════

async function testAuth() {
  console.log(`\n${C.magenta}${C.bold}┌──────────────────────────────────────────┐${C.reset}`)
  console.log(`${C.magenta}${C.bold}│  MÓDULO: AUTENTICACIÓN                   │${C.reset}`)
  console.log(`${C.magenta}${C.bold}└──────────────────────────────────────────┘${C.reset}`)

  // CP-01: Login correcto
  let r = await req('POST', '/auth/login', CRED_ADMIN)
  const p1 = registrar('CP-01','Auth','Login con credenciales válidas', r, 200,
    d => d && d.token && d.usuario && d.usuario.rol === 'administrador')
  if (p1) TOKEN = r.data.token

  // CP-02: Contraseña incorrecta
  r = await req('POST', '/auth/login', { email: CRED_ADMIN.email, password: 'wrongpass' })
  registrar('CP-02','Auth','Login con contraseña incorrecta', r, 401, null)

  // CP-03: Ruta protegida sin token
  r = await req('GET', '/mesas', null, null)
  registrar('CP-03','Auth','Ruta protegida sin token → 401', r, 401, null)

  // CP-04: Token inválido
  r = await req('GET', '/mesas', null, 'invalid.token.here')
  registrar('CP-04','Auth','Token malformado → 401 o 403', { ...r, status: r.status >= 400 ? r.status : 999 },
    r.status >= 400 ? r.status : 999,
    d => r.status >= 400)

  // CP-05: Login cajero
  r = await req('POST', '/auth/login', CRED_CAJERO)
  registrar('CP-05','Auth','Login cajero (rol mesero/cajero)', r, 200,
    d => d && d.token)
}

async function testMesas() {
  console.log(`\n${C.magenta}${C.bold}┌──────────────────────────────────────────┐${C.reset}`)
  console.log(`${C.magenta}${C.bold}│  MÓDULO: MESAS                           │${C.reset}`)
  console.log(`${C.magenta}${C.bold}└──────────────────────────────────────────┘${C.reset}`)

  // CP-06: Listar mesas
  let r = await req('GET', '/mesas', null, TOKEN)
  const p6 = registrar('CP-06','Mesas','GET /mesas → todas las mesas', r, 200,
    d => Array.isArray(d) && d.length > 0)
  if (p6) {
    const libre = r.data.find(m => m.estado === 'disponible')
    if (libre) { ID_MESA_LIBRE = libre.id_mesa; ID_MESA_RESERVA = libre.id_mesa }
  }

  // CP-07: Mesas disponibles
  r = await req('GET', '/mesas/disponibles', null, TOKEN)
  registrar('CP-07','Mesas','GET /mesas/disponibles', r, 200,
    d => Array.isArray(d))

  // CP-08: Obtener mesa por ID
  if (ID_MESA_LIBRE) {
    r = await req('GET', `/mesas/${ID_MESA_LIBRE}`, null, TOKEN)
    registrar('CP-08','Mesas',`GET /mesas/${ID_MESA_LIBRE}`, r, 200,
      d => d && d.id_mesa)
  } else {
    resultados.push({ id:'CP-08', modulo:'Mesas', descripcion:'GET /mesas/:id', pass: false, obs:'Sin mesa disponible para probar', status:'-' })
    console.log(`  ${C.yellow}⚠ SKIP  ${C.reset}CP-08   Mesas          Sin mesa disponible`)
  }

  // CP-09: Mesa inexistente
  r = await req('GET', '/mesas/99999', null, TOKEN)
  registrar('CP-09','Mesas','GET /mesas/99999 → 404', r, 404, null)
}

async function testPedidos() {
  console.log(`\n${C.magenta}${C.bold}┌──────────────────────────────────────────┐${C.reset}`)
  console.log(`${C.magenta}${C.bold}│  MÓDULO: PEDIDOS                         │${C.reset}`)
  console.log(`${C.magenta}${C.bold}└──────────────────────────────────────────┘${C.reset}`)

  // CP-10: Listar pedidos activos
  let r = await req('GET', '/pedidos/activos', null, TOKEN)
  registrar('CP-10','Pedidos','GET /pedidos/activos', r, 200,
    d => Array.isArray(d))

  // CP-11: Crear pedido en mesa disponible
  if (ID_MESA_LIBRE) {
    r = await req('POST', '/pedidos', { id_mesa: ID_MESA_LIBRE }, TOKEN)
    const p11 = registrar('CP-11','Pedidos','POST /pedidos (abrir pedido)', r, 201,
      d => d && (d.id_pedido || d.idPedido))
    if (p11) {
      ID_PEDIDO_TEST = r.data.id_pedido || r.data.idPedido
      // La mesa usada en pedido no debe usarse para la reserva
      const mesasR = await req('GET', '/mesas/disponibles', null, TOKEN)
      if (mesasR.ok && Array.isArray(mesasR.data) && mesasR.data.length > 0) {
        const otraLibre = mesasR.data.find(m => m.id_mesa !== ID_MESA_LIBRE)
        if (otraLibre) ID_MESA_RESERVA = otraLibre.id_mesa
      }
    }
  } else {
    resultados.push({ id:'CP-11', modulo:'Pedidos', descripcion:'POST /pedidos', pass: false, obs:'Sin mesa disponible', status:'-' })
    console.log(`  ${C.yellow}⚠ SKIP  ${C.reset}CP-11   Pedidos        Sin mesa disponible`)
    // Intentar con pedido existente
    const activos = await req('GET', '/pedidos/activos', null, TOKEN)
    if (activos.ok && activos.data.length > 0) ID_PEDIDO_TEST = activos.data[0].id_pedido
  }

  // CP-12: Crear pedido en mesa ya ocupada (debe fallar)
  if (ID_MESA_LIBRE) {
    r = await req('POST', '/pedidos', { id_mesa: ID_MESA_LIBRE }, TOKEN)
    registrar('CP-12','Pedidos','POST /pedidos en mesa ocupada → error', r,
      r.status >= 400 ? r.status : 409,
      d => r.status >= 400)
  }

  // CP-13: Obtener detalle de pedido
  if (ID_PEDIDO_TEST) {
    r = await req('GET', `/pedidos/${ID_PEDIDO_TEST}`, null, TOKEN)
    registrar('CP-13','Pedidos',`GET /pedidos/${ID_PEDIDO_TEST}`, r, 200,
      d => d && d.pedido)
  }

  // CP-14: Agregar producto al pedido (id_producto=1 = primer plato)
  if (ID_PEDIDO_TEST) {
    r = await req('POST', `/pedidos/${ID_PEDIDO_TEST}/productos`,
      { id_producto: 1, cantidad: 2 }, TOKEN)
    const p14 = registrar('CP-14','Pedidos','POST /pedidos/:id/productos (agregar)', r,
      r.status === 200 || r.status === 201 ? r.status : 200,
      d => d !== null && d !== undefined)
    if (p14 && r.data) {
      // Buscar id_detalle en la respuesta o en el detalle del pedido
      const det = await req('GET', `/pedidos/${ID_PEDIDO_TEST}`, null, TOKEN)
      if (det.ok && det.data.detalle && det.data.detalle.length > 0) {
        ID_DETALLE_TEST = det.data.detalle[0].id_detalle
      }
    }
  }

  // CP-15: Eliminar producto del pedido
  if (ID_PEDIDO_TEST && ID_DETALLE_TEST) {
    r = await req('DELETE', `/pedidos/${ID_PEDIDO_TEST}/productos/${ID_DETALLE_TEST}`, null, TOKEN)
    registrar('CP-15','Pedidos','DELETE /pedidos/:id/productos/:idDetalle', r, 200, null)
  } else {
    resultados.push({ id:'CP-15', modulo:'Pedidos', descripcion:'DELETE producto del pedido', pass: false, obs:'Sin id_detalle disponible', status:'-' })
    console.log(`  ${C.yellow}⚠ SKIP  ${C.reset}CP-15   Pedidos        Sin id_detalle disponible`)
  }
}

async function testProductos() {
  console.log(`\n${C.magenta}${C.bold}┌──────────────────────────────────────────┐${C.reset}`)
  console.log(`${C.magenta}${C.bold}│  MÓDULO: PRODUCTOS / MENÚ                │${C.reset}`)
  console.log(`${C.magenta}${C.bold}└──────────────────────────────────────────┘${C.reset}`)

  // CP-16: Listar categorías
  let r = await req('GET', '/productos/categorias', null, TOKEN)
  registrar('CP-16','Productos','GET /productos/categorias', r, 200,
    d => Array.isArray(d) && d.length > 0)

  // CP-17: Listar todos los productos
  r = await req('GET', '/productos', null, TOKEN)
  registrar('CP-17','Productos','GET /productos (todos)', r, 200,
    d => Array.isArray(d) && d.length > 0)

  // CP-18: Filtro disponibles
  r = await req('GET', '/productos?disponibles=true', null, TOKEN)
  registrar('CP-18','Productos','GET /productos?disponibles=true', r, 200,
    d => Array.isArray(d))

  // CP-19: Filtro por categoría
  r = await req('GET', '/productos?categoria=1', null, TOKEN)
  registrar('CP-19','Productos','GET /productos?categoria=1', r, 200,
    d => Array.isArray(d))

  // CP-20: Obtener producto por ID
  r = await req('GET', '/productos/1', null, TOKEN)
  registrar('CP-20','Productos','GET /productos/1', r, 200,
    d => d && d.id_producto)

  // CP-21: Crear producto
  const nuevoProducto = {
    id_categoria: 1,
    nombre: `TestProducto_${Date.now()}`,
    descripcion: 'Producto creado por test automático',
    precio: 15000,
    disponible: true
  }
  r = await req('POST', '/productos', nuevoProducto, TOKEN)
  const p21 = registrar('CP-21','Productos','POST /productos (crear)', r, 201,
    d => d && d.id_producto)
  if (p21) ID_PRODUCTO_TEST = r.data.id_producto

  // CP-22: Actualizar producto
  if (ID_PRODUCTO_TEST) {
    r = await req('PUT', `/productos/${ID_PRODUCTO_TEST}`,
      { ...nuevoProducto, precio: 18000, descripcion: 'Precio actualizado por test' }, TOKEN)
    registrar('CP-22','Productos',`PUT /productos/${ID_PRODUCTO_TEST}`, r, 200, null)
  }

  // CP-23: Toggle disponible → false
  if (ID_PRODUCTO_TEST) {
    r = await req('PUT', `/productos/${ID_PRODUCTO_TEST}`,
      { ...nuevoProducto, disponible: false }, TOKEN)
    registrar('CP-23','Productos','PUT /productos/:id (toggle disponible=false)', r, 200,
      d => d !== null && d !== undefined)
  }

  // CP-24: Eliminar producto de prueba
  if (ID_PRODUCTO_TEST) {
    r = await req('DELETE', `/productos/${ID_PRODUCTO_TEST}`, null, TOKEN)
    registrar('CP-24','Productos',`DELETE /productos/${ID_PRODUCTO_TEST}`, r, 200, null)
  }

  // CP-25: Producto inexistente
  r = await req('GET', '/productos/99999', null, TOKEN)
  registrar('CP-25','Productos','GET /productos/99999 → error esperado', r,
    r.status >= 400 ? r.status : 404,
    () => r.status >= 400)
}

async function testReservas() {
  console.log(`\n${C.magenta}${C.bold}┌──────────────────────────────────────────┐${C.reset}`)
  console.log(`${C.magenta}${C.bold}│  MÓDULO: RESERVAS                        │${C.reset}`)
  console.log(`${C.magenta}${C.bold}└──────────────────────────────────────────┘${C.reset}`)

  // CP-26: Listar reservas (hoy)
  let r = await req('GET', `/reservas?fecha=${HOY}`, null, TOKEN)
  registrar('CP-26','Reservas','GET /reservas?fecha=hoy', r, 200,
    d => Array.isArray(d))

  // CP-27: Listar reservas sin filtro
  r = await req('GET', '/reservas', null, TOKEN)
  registrar('CP-27','Reservas','GET /reservas (sin filtro)', r, 200,
    d => Array.isArray(d))

  // CP-28: Crear reserva
  const mañana = new Date(); mañana.setDate(mañana.getDate() + 1)
  const fechaMañana = mañana.toISOString().split('T')[0]
  const mesaId = ID_MESA_RESERVA || 2

  const nuevaReserva = {
    nombre_cliente: 'Cliente Test Automático',
    telefono:       '3001234567',
    id_mesa:        mesaId,
    fecha:          fechaMañana,
    hora:           '13:00',
    num_personas:   2,
    observaciones:  'Reserva de prueba automatizada'
  }
  r = await req('POST', '/reservas', nuevaReserva, TOKEN)
  const p28 = registrar('CP-28','Reservas','POST /reservas (crear)', r, 201,
    d => d && d.id_reserva)
  if (p28) ID_RESERVA_TEST = r.data.id_reserva

  // CP-29: Obtener reserva por ID
  if (ID_RESERVA_TEST) {
    r = await req('GET', `/reservas/${ID_RESERVA_TEST}`, null, TOKEN)
    registrar('CP-29','Reservas',`GET /reservas/${ID_RESERVA_TEST}`, r, 200,
      d => d && d.id_reserva)
  }

  // CP-30: Cambiar estado a confirmada
  if (ID_RESERVA_TEST) {
    r = await req('PATCH', `/reservas/${ID_RESERVA_TEST}/estado`, { estado: 'confirmada' }, TOKEN)
    registrar('CP-30','Reservas','PATCH /reservas/:id/estado (→confirmada)', r, 200, null)
  }

  // CP-31: Cambiar estado a completada
  if (ID_RESERVA_TEST) {
    r = await req('PATCH', `/reservas/${ID_RESERVA_TEST}/estado`, { estado: 'completada' }, TOKEN)
    registrar('CP-31','Reservas','PATCH /reservas/:id/estado (→completada)', r, 200, null)
  }

  // CP-32: Cancelar reserva (crear una nueva primero)
  const reservaCancelar = { ...nuevaReserva, hora: '14:00', observaciones: 'Para cancelar' }
  r = await req('POST', '/reservas', reservaCancelar, TOKEN)
  if (r.ok && r.data && r.data.id_reserva) {
    const idCancel = r.data.id_reserva
    r = await req('DELETE', `/reservas/${idCancel}`, null, TOKEN)
    registrar('CP-32','Reservas',`DELETE /reservas/:id (cancelar)`, r, 200, null)
  } else {
    resultados.push({ id:'CP-32', modulo:'Reservas', descripcion:'DELETE /reservas/:id', pass: false, obs:'No se pudo crear reserva para cancelar', status:'-' })
    console.log(`  ${C.yellow}⚠ SKIP  ${C.reset}CP-32   Reservas       No se pudo crear reserva para cancelar`)
  }
}

async function testFacturas() {
  console.log(`\n${C.magenta}${C.bold}┌──────────────────────────────────────────┐${C.reset}`)
  console.log(`${C.magenta}${C.bold}│  MÓDULO: FACTURAS                        │${C.reset}`)
  console.log(`${C.magenta}${C.bold}└──────────────────────────────────────────┘${C.reset}`)

  // CP-33: Listar facturas
  let r = await req('GET', '/facturas?fechaInicio=&fechaFin=', null, TOKEN)
  registrar('CP-33','Facturas','GET /facturas (historial)', r, 200,
    d => Array.isArray(d))

  // CP-34: Ingresos por día
  r = await req('GET', '/facturas/ingresos/dia', null, TOKEN)
  registrar('CP-34','Facturas','GET /facturas/ingresos/dia', r, 200,
    d => Array.isArray(d))

  // CP-35: Ingresos por categoría
  r = await req('GET', '/facturas/ingresos/categorias', null, TOKEN)
  registrar('CP-35','Facturas','GET /facturas/ingresos/categorias', r, 200,
    d => Array.isArray(d))

  // CP-36: Generar factura (si hay pedido activo)
  if (ID_PEDIDO_TEST) {
    // Re-agregar producto para que el pedido tenga contenido
    await req('POST', `/pedidos/${ID_PEDIDO_TEST}/productos`,
      { id_producto: 2, cantidad: 1 }, TOKEN)

    r = await req('POST', '/facturas',
      { id_pedido: ID_PEDIDO_TEST, medio_pago: 'efectivo' }, TOKEN)
    registrar('CP-36','Facturas','POST /facturas (generar)', r, 201,
      d => d && d.numero_factura)

    // CP-37: Intentar facturar el mismo pedido de nuevo
    if (r.status === 201) {
      const r2 = await req('POST', '/facturas',
        { id_pedido: ID_PEDIDO_TEST, medio_pago: 'tarjeta' }, TOKEN)
      registrar('CP-37','Facturas','POST /facturas pedido ya facturado → error', r2,
        r2.status >= 400 ? r2.status : 409,
        () => r2.status >= 400)
    }
  } else {
    console.log(`  ${C.yellow}⚠ SKIP  ${C.reset}CP-36   Facturas       Sin pedido activo de prueba`)
    console.log(`  ${C.yellow}⚠ SKIP  ${C.reset}CP-37   Facturas       Depende de CP-36`)
    resultados.push({ id:'CP-36', modulo:'Facturas', descripcion:'POST /facturas', pass: false, obs:'Sin pedido activo', status:'-' })
    resultados.push({ id:'CP-37', modulo:'Facturas', descripcion:'Doble facturación', pass: false, obs:'Sin pedido activo', status:'-' })
  }

  // CP-38: Factura sin campos requeridos
  r = await req('POST', '/facturas', { id_pedido: 999 }, TOKEN)
  registrar('CP-38','Facturas','POST /facturas sin medio_pago → 400', r, 400, null)
}

async function testDashboard() {
  console.log(`\n${C.magenta}${C.bold}┌──────────────────────────────────────────┐${C.reset}`)
  console.log(`${C.magenta}${C.bold}│  MÓDULO: DASHBOARD                       │${C.reset}`)
  console.log(`${C.magenta}${C.bold}└──────────────────────────────────────────┘${C.reset}`)

  const r = await req('GET', '/dashboard/resumen', null, TOKEN)
  registrar('CP-39','Dashboard','GET /dashboard/resumen', r, 200,
    d => d && (d.mesas_disponibles !== undefined) && (d.ventas_hoy !== undefined))
}

// ════════════════════════════════════════════════════════════════
//  REPORTE FINAL EN CONSOLA
// ════════════════════════════════════════════════════════════════
function imprimirResumen() {
  const pass  = resultados.filter(r => r.pass).length
  const fail  = resultados.filter(r => !r.pass).length
  const total = resultados.length
  const pct   = Math.round(pass / total * 100)

  console.log(`\n${C.bold}${'═'.repeat(80)}${C.reset}`)
  console.log(`${C.bold}  RESUMEN FINAL — SazonApp API Test Suite${C.reset}`)
  console.log(`${'═'.repeat(80)}`)
  console.log(`  Total de casos : ${C.bold}${total}${C.reset}`)
  console.log(`  ${C.green}${C.bold}PASS${C.reset}           : ${C.green}${C.bold}${pass}${C.reset}`)
  console.log(`  ${C.red}${C.bold}FAIL${C.reset}           : ${C.red}${C.bold}${fail}${C.reset}`)
  console.log(`  Tasa de éxito  : ${pct >= 80 ? C.green : C.red}${C.bold}${pct}%${C.reset}`)

  if (fail > 0) {
    console.log(`\n${C.red}${C.bold}  Casos fallidos:${C.reset}`)
    resultados.filter(r => !r.pass).forEach(r => {
      console.log(`  ${C.red}✗${C.reset} ${r.id.padEnd(8)} ${r.modulo.padEnd(14)} ${r.descripcion}`)
      console.log(`    ${C.gray}→ ${r.obs}${C.reset}`)
    })
  }
  console.log(`${'═'.repeat(80)}\n`)
}

// ════════════════════════════════════════════════════════════════
//  GENERAR REPORTE HTML
// ════════════════════════════════════════════════════════════════
function generarHTML() {
  const pass  = resultados.filter(r => r.pass).length
  const fail  = resultados.filter(r => !r.pass).length
  const total = resultados.length
  const pct   = Math.round(pass / total * 100)
  const fecha = new Date().toLocaleString('es-CO')

  const filas = resultados.map(r => {
    const badge = r.pass
      ? `<span class="badge pass">✓ PASS</span>`
      : `<span class="badge fail">✗ FAIL</span>`
    return `
      <tr class="${r.pass ? '' : 'fila-fail'}">
        <td class="mono">${r.id}</td>
        <td><span class="modulo">${r.modulo}</span></td>
        <td>${r.descripcion}</td>
        <td class="mono">${r.status}</td>
        <td>${badge}</td>
        <td class="obs">${r.obs}</td>
      </tr>`
  }).join('')

  const failList = resultados.filter(r => !r.pass).map(r =>
    `<li><strong>${r.id}</strong> — ${r.descripcion}: <span class="obs-text">${r.obs}</span></li>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>SazonApp — Reporte de Pruebas API</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f9fafb; color: #111827; }
  header { background: #1e0a2e; color: white; padding: 28px 40px; }
  header h1 { font-size: 22px; font-weight: 800; }
  header p  { font-size: 13px; color: #d1d5db; margin-top: 4px; }
  .container { max-width: 1100px; margin: 0 auto; padding: 28px 20px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
  .kpi  { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; text-align: center; }
  .kpi-val { font-size: 38px; font-weight: 900; }
  .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin-top: 4px; }
  .kpi.verde .kpi-val { color: #16a34a }
  .kpi.rojo  .kpi-val { color: #dc2626 }
  .kpi.azul  .kpi-val { color: #2563eb }
  .kpi.amber .kpi-val { color: #d97706 }
  .card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 20px; }
  .card-header { background: #1e0a2e; color: white; padding: 12px 18px; font-size: 13px; font-weight: 700; letter-spacing: .04em; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { background: #1e0a2e; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
  td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  tr:last-child td { border-bottom: none }
  tr:nth-child(even) { background: #f9fafb }
  .fila-fail td { background: #fff1f2 !important }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge.pass { background: #dcfce7; color: #15803d }
  .badge.fail { background: #fee2e2; color: #b91c1c }
  .modulo { background: #fce7f3; color: #be185d; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .mono { font-family: 'Courier New', monospace; font-size: 12px; }
  .obs  { font-size: 11.5px; color: #6b7280; }
  .obs-text { color: #dc2626 }
  .barra-wrap { background: #e5e7eb; border-radius: 99px; height: 10px; margin: 8px 0 4px; overflow: hidden; }
  .barra { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #be185d, #7c3aed); }
  .alertas { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 16px 20px; }
  .alertas h3 { color: #c2410c; margin-bottom: 8px; font-size: 14px; }
  .alertas li { margin: 5px 0 5px 16px; font-size: 13px; }
  footer { text-align: center; color: #9ca3af; font-size: 12px; margin: 30px 0 16px; }
</style>
</head>
<body>
<header>
  <h1>🍽 SazonApp — Reporte de Pruebas API</h1>
  <p>Generado el ${fecha} · Backend: http://localhost:3001/api</p>
</header>
<div class="container">

  <div class="kpis">
    <div class="kpi verde"><div class="kpi-val">${pass}</div><div class="kpi-label">Casos PASS</div></div>
    <div class="kpi rojo"> <div class="kpi-val">${fail}</div><div class="kpi-label">Casos FAIL</div></div>
    <div class="kpi azul"> <div class="kpi-val">${total}</div><div class="kpi-label">Total ejecutados</div></div>
    <div class="kpi amber"><div class="kpi-val">${pct}%</div><div class="kpi-label">Tasa de éxito</div></div>
  </div>

  <div class="card" style="padding: 16px 20px; margin-bottom: 20px;">
    <div style="font-size:13px; font-weight:700; margin-bottom:6px; color:#1e0a2e">Progreso general</div>
    <div class="barra-wrap"><div class="barra" style="width:${pct}%"></div></div>
    <div style="font-size:11px; color:#6b7280">${pass} de ${total} pruebas exitosas</div>
  </div>

  ${fail > 0 ? `
  <div class="alertas" style="margin-bottom:20px">
    <h3>⚠ Casos que requieren atención</h3>
    <ul>${failList}</ul>
  </div>` : `
  <div style="background:#dcfce7; border:1px solid #86efac; border-radius:10px; padding:14px 20px; margin-bottom:20px; color:#15803d; font-weight:700; font-size:14px;">
    ✅ ¡Todos los casos de prueba pasaron exitosamente!
  </div>`}

  <div class="card">
    <div class="card-header">📋 Detalle de Casos de Prueba</div>
    <table>
      <thead><tr><th>ID</th><th>Módulo</th><th>Descripción</th><th>HTTP</th><th>Estado</th><th>Observación</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </div>
</div>
<footer>SazonApp · Universidad Autónoma del Cauca · ${new Date().getFullYear()}</footer>
</body>
</html>`

  const fs   = require('fs')
  const path = require('path')
  const out  = path.join(__dirname, '..', 'Diagramas', 'reporte_pruebas_api.html')
  fs.writeFileSync(out, html, 'utf8')
  console.log(`\n${C.green}${C.bold}📄 Reporte HTML guardado en:${C.reset}`)
  console.log(`   ${C.cyan}Diagramas/reporte_pruebas_api.html${C.reset}\n`)
}

// ════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════
async function main() {
  console.log(`\n${C.magenta}${C.bold}`)
  console.log('  ╔═══════════════════════════════════════════════════════════╗')
  console.log('  ║   SAZONAPP — SUITE DE PRUEBAS COMPLETA DE API            ║')
  console.log('  ║   Sazón y Sabor · Popayán, Cauca                        ║')
  console.log('  ╚═══════════════════════════════════════════════════════════╝')
  console.log(C.reset)
  console.log(`  Servidor: ${C.cyan}${BASE}${C.reset}`)
  console.log(`  Fecha:    ${C.cyan}${new Date().toLocaleString('es-CO')}${C.reset}`)
  console.log('')

  // Verificar conectividad
  console.log(`  ${C.yellow}Verificando conexión al servidor...${C.reset}`)
  const ping = await req('POST', '/auth/login', { email: 'x', password: 'x' })
  if (ping.status === 0) {
    console.log(`\n  ${C.red}${C.bold}❌ No se puede conectar al servidor en ${BASE}${C.reset}`)
    console.log(`  ${C.yellow}Asegúrate de que el backend está corriendo:${C.reset}`)
    console.log(`  ${C.cyan}  cd backend && npm run dev${C.reset}`)
    console.log(`  ${C.gray}  Error: ${ping.error}${C.reset}\n`)
    process.exit(1)
  }
  console.log(`  ${C.green}✓ Servidor respondiendo correctamente${C.reset}\n`)

  console.log(
    `  ${'ID'.padEnd(10)}${'Módulo'.padEnd(16)}${'Descripción'.padEnd(54)}${'HTTP'.padEnd(8)}Observación`
  )
  console.log(`  ${'─'.repeat(110)}`)

  await testAuth()
  await testMesas()
  await testPedidos()
  await testProductos()
  await testReservas()
  await testFacturas()
  await testDashboard()

  imprimirResumen()
  generarHTML()
}

main().catch(e => {
  console.error(`\n${C.red}Error inesperado: ${e.message}${C.reset}\n`)
  process.exit(1)
})
