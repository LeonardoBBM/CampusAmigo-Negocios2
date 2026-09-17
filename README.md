# CampusAmigo - Marketplace y CRM académico

CampusAmigo es un proyecto universitario de comercio electrónico. En esta etapa incorpora un CRM con backend Express, persistencia SQLite, autenticación por sesión y vistas para dar seguimiento a clientes.

## Requisitos

- Node.js 24.15 o posterior.
- Dependencias instaladas con `npm install`.

## Ejecutar el proyecto

```powershell
npm start
```

El servidor publica el sitio en `http://127.0.0.1:3000`. Si es la primera ejecución, la terminal mostrará una liga temporal para crear al primer administrador. Después se ingresa desde `/crm/login.html`.

Para desarrollo con reinicio automático:

```powershell
npm run dev
```

## Módulos del CRM

- Resumen: indicadores, estado de la cartera y clientes en riesgo.
- Clientes: alta, edición, búsqueda, filtros, cambio de etapa y baja lógica.
- Expediente: información completa, historial, nueva interacción y evaluaciones.
- Interacciones: consulta general con tipo y responsable.
- Mi actividad: interacciones atribuidas al usuario autenticado por periodo.
- Reportes: actividad por tipo, clientes por etapa e interacciones por cliente.
- Usuarios: alta, roles y activación; disponible solo para administradores.
- Configuración: umbral de días para detectar clientes sin interacción reciente.

## Roles

| Acción | Administrador | Usuario |
| --- | --- | --- |
| Consultar clientes e historiales | Sí | Sí |
| Registrar interacción o evaluación | Sí | Sí |
| Cambiar etapa CRM | Sí | Sí |
| Crear, editar o dar de baja clientes | Sí | No |
| Administrar usuarios y configuración | Sí | No |
| Consultar toda la actividad | Sí | Solo la propia |

Las autorizaciones se validan en el servidor; ocultar una opción en la interfaz no sustituye el control de permisos.

## Datos y pruebas

SQLite guarda la información localmente en `data/campusamigo.sqlite`. Las migraciones están en `server/database/migrations` y se ejecutan automáticamente al iniciar el servidor.

```powershell
npm test
```

Las pruebas usan bases temporales en memoria y no modifican los datos locales. El marketplace, las compras y los pagos continúan siendo simulaciones académicas.
