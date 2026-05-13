const authService = require('../services/authService');

const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ error: 'email y password son requeridos' });
      const resultado = await authService.login(email, password);
      res.json(resultado);
    } catch (err) { next(err); }
  }
};

module.exports = authController;
