const dashboardService = require('../services/dashboardService');

const dashboardController = {
  getResumen: async (req, res, next) => {
    try {
      const resumen       = await dashboardService.getResumen();
      const ingresosMes   = await dashboardService.getIngresosDelMes();
      res.json({ ...resumen, ingresos_mes: ingresosMes });
    } catch (err) { next(err); }
  }
};

module.exports = dashboardController;
