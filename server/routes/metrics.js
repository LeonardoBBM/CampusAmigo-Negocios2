const express = require("express");
const { ApiError } = require("../lib/api-error");
const validation = require("../lib/validation");
const { readSettings } = require("./settings");

function reportingPeriod(query) {
  if ((query.desde && !query.hasta) || (!query.desde && query.hasta)) {
    throw new ApiError(400, "Indica tanto la fecha desde como la fecha hasta.");
  }

  if (query.desde && query.hasta) {
    const fromDay = validation.dateOnly(query.desde, "desde");
    const untilDay = validation.dateOnly(query.hasta, "hasta");
    const from = new Date(`${fromDay}T00:00:00.000Z`);
    const until = new Date(`${untilDay}T00:00:00.000Z`);
    until.setUTCDate(until.getUTCDate() + 1);
    if (from >= until) {
      throw new ApiError(400, "La fecha desde debe ser anterior o igual a la fecha hasta.");
    }
    return { from: from.toISOString(), until: until.toISOString() };
  }

  const now = new Date();
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    until: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()
  };
}

function createMetricsRouter({ db, auth }) {
  const router = express.Router();
  router.use((request, response, next) => {
    response.locals.apiRequest = true;
    next();
  });

  router.get("/metricas", auth.requireAuth, (request, response) => {
    const period = reportingPeriod(request.query);
    const riskDays = readSettings(db).dias_riesgo;
    const riskCutoff = new Date(Date.now() - riskDays * 86400000).toISOString();

    const clients = db.prepare(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(status = 'activo'), 0) AS activos,
        COALESCE(SUM(status = 'inactivo'), 0) AS inactivos
      FROM clients
      WHERE deleted_at IS NULL
    `).get();
    const periodInteractions = db.prepare(`
      SELECT COUNT(*) AS total
      FROM interactions i
      JOIN clients c ON c.id = i.client_id
      WHERE c.deleted_at IS NULL
        AND i.occurred_at >= ?
        AND i.occurred_at < ?
    `).get(period.from, period.until).total;
    const atRiskTotal = db.prepare(`
      SELECT COUNT(*) AS total
      FROM clients c
      WHERE c.deleted_at IS NULL
        AND c.status = 'activo'
        AND NOT EXISTS (
          SELECT 1
          FROM interactions i
          WHERE i.client_id = c.id AND i.occurred_at >= ?
        )
    `).get(riskCutoff).total;

    const byType = db.prepare(`
      SELECT i.type AS tipo, COUNT(*) AS total
      FROM interactions i
      JOIN clients c ON c.id = i.client_id
      WHERE c.deleted_at IS NULL
        AND i.occurred_at >= ?
        AND i.occurred_at < ?
      GROUP BY i.type
      ORDER BY total DESC, i.type
    `).all(period.from, period.until);
    const byStage = db.prepare(`
      SELECT crm_stage AS etapa, COUNT(*) AS total
      FROM clients
      WHERE deleted_at IS NULL
      GROUP BY crm_stage
      ORDER BY total DESC, crm_stage
    `).all();
    const byClient = db.prepare(`
      SELECT
        c.id,
        c.name AS nombre,
        c.crm_stage AS etapa_crm,
        COUNT(i.id) AS interacciones,
        MAX(i.occurred_at) AS ultima_interaccion
      FROM clients c
      LEFT JOIN interactions i ON i.client_id = c.id
      WHERE c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY interacciones DESC, c.name COLLATE NOCASE
      LIMIT 100
    `).all();
    const atRisk = db.prepare(`
      SELECT
        c.id,
        c.name AS nombre,
        c.company AS empresa,
        c.crm_stage AS etapa_crm,
        MAX(i.occurred_at) AS ultima_interaccion,
        CAST(julianday('now') - julianday(COALESCE(MAX(i.occurred_at), c.registered_at)) AS INTEGER)
          AS dias_sin_interaccion
      FROM clients c
      LEFT JOIN interactions i ON i.client_id = c.id
      WHERE c.deleted_at IS NULL AND c.status = 'activo'
      GROUP BY c.id
      HAVING ultima_interaccion IS NULL OR ultima_interaccion < ?
      ORDER BY ultima_interaccion IS NULL DESC, dias_sin_interaccion DESC, c.name COLLATE NOCASE
      LIMIT 10
    `).all(riskCutoff);
    const evaluation = db.prepare(`
      SELECT COUNT(*) AS total, ROUND(AVG(score), 1) AS promedio
      FROM evaluations
      WHERE evaluated_at >= ? AND evaluated_at < ?
    `).get(period.from, period.until);

    response.json({
      periodo: { desde: period.from, hasta_exclusiva: period.until },
      dias_riesgo: riskDays,
      resumen: {
        total_clientes: clients.total,
        clientes_activos: clients.activos,
        clientes_inactivos: clients.inactivos,
        interacciones_periodo: periodInteractions,
        clientes_sin_interaccion_reciente: atRiskTotal,
        evaluaciones_periodo: evaluation.total,
        evaluacion_promedio: evaluation.promedio
      },
      interacciones_por_tipo: byType,
      clientes_por_etapa: byStage,
      interacciones_por_cliente: byClient,
      clientes_en_riesgo: atRisk
    });
  });

  return router;
}

module.exports = { createMetricsRouter };
