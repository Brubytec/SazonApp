const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/usuarioController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

// Gestión de usuarios: solo administrador.
router.use(verificarToken, soloAdmin);

// GET   /api/usuarios               → listar (sin contraseñas)
// POST  /api/usuarios               → crear { nombre, email, password, rol }
// PUT   /api/usuarios/:id           → editar { nombre, email, rol }
// PATCH /api/usuarios/:id/estado    → activar / desactivar { activo }
// PATCH /api/usuarios/:id/password  → cambiar contraseña { password }
router.get('/',                ctrl.listar);
router.post('/',               ctrl.crear);
router.put('/:id',             ctrl.actualizar);
router.patch('/:id/estado',    ctrl.cambiarEstado);
router.patch('/:id/password',  ctrl.cambiarPassword);

module.exports = router;
