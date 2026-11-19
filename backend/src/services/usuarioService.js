const usuarioRepository = require('../repositories/usuarioRepository');
const authService       = require('./authService');

const ROLES = ['administrador', 'cajero', 'mesero'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorHttp = (status, mensaje) => {
  const err = new Error(mensaje);
  err.status = status;
  return err;
};

const validarPassword = (password) => {
  if (!password || password.length < 8) {
    throw errorHttp(400, 'La contraseña debe tener al menos 8 caracteres');
  }
};

const validarDatos = ({ nombre, email, rol }) => {
  if (!nombre || !nombre.trim()) throw errorHttp(400, 'El nombre es obligatorio');
  if (!email || !EMAIL_RE.test(email.trim())) throw errorHttp(400, 'El correo no es válido');
  if (!ROLES.includes(rol)) throw errorHttp(400, `Rol inválido. Valores: ${ROLES.join(', ')}`);
  return { nombre: nombre.trim(), email: email.trim().toLowerCase(), rol };
};

const usuarioService = {
  obtenerTodos: () => usuarioRepository.findAll(),

  crear: async (datos) => {
    const limpio = validarDatos(datos);
    validarPassword(datos.password);
    const passwordHash = await authService.hashPassword(datos.password);
    try {
      const id = await usuarioRepository.insert({ ...limpio, passwordHash });
      return usuarioRepository.findById(id);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') throw errorHttp(409, 'Ya existe un usuario con ese correo');
      throw err;
    }
  },

  actualizar: async (id, datos, idSolicitante) => {
    const actual = await usuarioRepository.findById(id);
    if (!actual) throw errorHttp(404, 'Usuario no encontrado');
    const limpio = validarDatos({ ...actual, ...datos });
    if (Number(id) === Number(idSolicitante) && limpio.rol !== 'administrador') {
      throw errorHttp(400, 'No puedes quitarte el rol de administrador a ti mismo');
    }
    try {
      await usuarioRepository.update(id, limpio);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') throw errorHttp(409, 'Ya existe un usuario con ese correo');
      throw err;
    }
    return usuarioRepository.findById(id);
  },

  cambiarEstado: async (id, activo, idSolicitante) => {
    if (Number(id) === Number(idSolicitante) && !activo) {
      throw errorHttp(400, 'No puedes desactivar tu propio usuario');
    }
    if (!(await usuarioRepository.updateActivo(id, Boolean(activo)))) throw errorHttp(404, 'Usuario no encontrado');
    return usuarioRepository.findById(id);
  },

  cambiarPassword: async (id, password) => {
    validarPassword(password);
    const hash = await authService.hashPassword(password);
    if (!(await usuarioRepository.updatePassword(id, hash))) throw errorHttp(404, 'Usuario no encontrado');
  }
};

module.exports = usuarioService;
