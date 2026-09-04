const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { config } = require("./config");
const { createAuthMiddleware } = require("./middleware/auth");
const { createAuthRouter } = require("./routes/auth");
const { createClientsRouter } = require("./routes/clients");
const { createHealthRouter } = require("./routes/health");

function rootHtmlPages(projectRoot) {
  return new Set(
    fs.readdirSync(projectRoot)
      .filter(file => file.endsWith(".html"))
  );
}

function createApp({ db, projectRoot = config.projectRoot, setupToken = null }) {
  if (!db) throw new Error("La aplicación necesita una conexión de base de datos.");

  const app = express();
  const htmlPages = rootHtmlPages(projectRoot);
  const auth = createAuthMiddleware({ db });

  app.disable("x-powered-by");
  app.use((request, response, next) => {
    response.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    });
    next();
  });
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(auth.optionalAuth);

  app.use("/api", (request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
  });
  app.use("/api", createHealthRouter({ db }));
  app.use("/api", createAuthRouter({ db, auth, setupToken }));
  app.use("/api", createClientsRouter({ db, auth }));
  app.use(createClientsRouter({ db, auth }));

  const staticOptions = { index: false, dotfiles: "deny" };
  app.use("/assets", express.static(path.join(projectRoot, "assets"), {
    ...staticOptions,
    maxAge: "1d"
  }));
  app.use("/css", express.static(path.join(projectRoot, "css"), staticOptions));
  app.use("/js", express.static(path.join(projectRoot, "js"), staticOptions));
  app.use("/admin", express.static(path.join(projectRoot, "admin"), {
    ...staticOptions,
    extensions: ["html"]
  }));
  app.use("/crm", express.static(path.join(projectRoot, "crm"), {
    ...staticOptions,
    index: "index.html",
    extensions: ["html"]
  }));

  app.get("/", (request, response) => {
    response.sendFile(path.join(projectRoot, "index.html"));
  });

  app.get("/:page", (request, response, next) => {
    if (!htmlPages.has(request.params.page)) return next();
    return response.sendFile(path.join(projectRoot, request.params.page));
  });

  app.use("/api", (request, response) => {
    response.status(404).json({
      error: "Ruta de API no encontrada."
    });
  });

  app.use((request, response) => {
    response.status(404).type("text/plain").send("Página no encontrada.");
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    const malformedJson = error instanceof SyntaxError && error.status === 400;
    const status = malformedJson ? 400 : (error.status || 500);
    const message = malformedJson
      ? "El cuerpo JSON no es válido."
      : (status < 500 ? error.message : "Ocurrió un error interno.");

    if (status >= 500) console.error(error);

    if (response.locals.apiRequest || request.path.startsWith("/api/")) {
      const payload = { error: message };
      if (error.details) payload.details = error.details;
      return response.status(status).json(payload);
    }

    return response.status(status).type("text/plain").send(message);
  });

  return app;
}

module.exports = { createApp };
