const db = require('../config/db');

const dashboardService = {

  getResumen: async () => {
    // Llama al procedimiento almacenado sp_ResumenDashboard
    const [rows] = await db.query('CALL sp_ResumenDashboard()');
    return rows[0][0];
  },

  getIngresosDelMes: async () => {
    const [rows] = await db.query(
      'SELECT fn_IngresosDelMes(YEAR(NOW()), MONTH(NOW())) AS ingresos_mes'
    );
    return rows[0].ingresos_mes;
  }
};

module.exports = dashboardService;
