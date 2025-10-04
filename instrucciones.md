Instrucciones

Aquí tienes el documento de instrucciones para Cline (AI). Está pensado para integrarse sin romper nada de lo existente (solo lecturas, sin escrituras), y cubrir el flujo de dos botones por especialidad: “Precio regular” vs “Club Medical”.

Objetivo

Cuando el usuario elija una especialidad (p. ej. Ginecología) y el sistema tenga la cédula del paciente:

Validar si el paciente pertenece a Club Medical (membresía vigente).

Mostrar el precio correcto según el botón:

Precio regular (particular).

Precio Club Medical (solo si es miembro vigente).

Si intenta ver precio Club Medical sin pertenecer, mostrar:

“No eres Club Medical, suscríbete por tan solo $10 al año para precios preferenciales y recibe tu primera consulta de Medicina General gratuita” + [ENLACE_CLUB_MEDICAL] (lo provee el usuario).

Reglas de seguridad (no romper lo existente)

Solo consultas READ-ONLY a la base de datos (no INSERT/UPDATE/DELETE).

No modificar tablas, vistas, ni configuraciones existentes.

Manejar errores y nulos sin lanzar excepciones no controladas.

Consultas con límites (LIMIT 1) cuando aplique y sanitizar entradas (binding de parámetros).

Esquema mínimo relevante (resumen)

tipoServicio (idTipoServicio, codigo, descripcion, precioReferencial): catálogo maestro de servicios. La descripcion suele incluir “Consulta …”, especialidad, plan/pagador (“Particular”, “ISSFA”, “Club Medical”, etc.) y, a veces, sede (“MediSur”, “Santo Domingo”, etc.).

servicioEmpresa (idServicioEmpresa, idTipoServicio, idBioEmpresa, precioUnitario): precio vigente por empresa (override de precioReferencial). Para Medical&Care usar idBioEmpresa = 1.

especialidad (idEspecialidad, descripcion): nombre de especialidad.

v_medico / medico: datos de médicos (no se usan para precio de catálogo).

Planes:

tipoPlan: catálogo de planes (en tu BD no hay nombre; Club Medical es el plan de valorIndividual = 10.00, idTipoPlan más reciente → hoy es 15).

personaPlan: afiliación del titular (fechas/estado).

perPlanIntegrante: integrantes del plan familiar (si aplica).

persona / v_persona: búsqueda por documento (cédula).

Entradas → Salidas

Entradas

cedula (string)

especialidad (string, p. ej. “Ginecología”)

boton ∈ {regular, club}

(Opcional) sede (string), variante (p. ej. “+PAP”, “Revisión”, “Consecutiva”)

Salidas

es_miembro_club ∈ {0,1}

precio (decimal)

servicio (string: descripción de tipoServicio)

idTipoServicio (int)

En caso de no pertenecer y pedir precio club: mensaje_bloqueo + link_inscripcion

Paso 1 — Resolver idPersona por cédula

Usa primero v_persona; si no, cae a persona. Detecta la columna correcta del documento entre: cedula, documento, ci, dni, identificacion.

Pseudocódigo SQL (preparado por aplicación):

SHOW COLUMNS FROM v_persona → si existe alguna de las columnas de documento, úsala:
SELECT idPersona FROM v_persona WHERE <DOC_COL> = :cedula LIMIT 1;

Si no está en v_persona, intenta en persona:
SELECT idPersona FROM persona WHERE <DOC_COL> = :cedula LIMIT 1;
Salida: idPersona (si no existe, bloquear botón club y devolver precio regular sin membresía).

Paso 2 — Verificar membresía Club Medical (vigente)

Usa idTipoPlan = 15 (Club a $10) o, si prefieres no hardcodear:
-- Subquery para obtener el id más reciente de plan a $10
(SELECT idTipoPlan FROM tipoPlan WHERE valorIndividual=10.00 ORDER BY fecha DESC LIMIT 1)

One-liner (con idPersona y idTipoPlan ya resueltos):
SELECT (
  EXISTS(
    SELECT 1
    FROM personaPlan pp
    WHERE pp.idPersona = :idPersona
      AND pp.idTipoPlan = :idPlanClub
      AND COALESCE(pp.idEstado,1)=1
      AND (pp.fechaInicio IS NULL OR pp.fechaInicio<=CURDATE())
      AND (pp.fechaFin    IS NULL OR pp.fechaFin>=CURDATE())
  )
  OR EXISTS(
    SELECT 1
    FROM perPlanIntegrante ppi
    JOIN personaPlan pp ON pp.idPersonaPlan = ppi.idPersonaPlan
    WHERE ppi.idPersona = :idPersona
      AND pp.idTipoPlan = :idPlanClub
      AND COALESCE(pp.idEstado,1)=1
      AND COALESCE(ppi.idEstado,1)=1
      AND (pp.fechaInicio IS NULL OR pp.fechaInicio<=CURDATE())
      AND (pp.fechaFin    IS NULL OR pp.fechaFin>=CURDATE())
  )
) AS es_miembro_club;

Paso 3 — Resolver precio (regular vs club)

Regla general: tomar de servicioEmpresa.precioUnitario con idBioEmpresa=1; si es NULL, caer a tipoServicio.precioReferencial.

3.1 Precio regular (particular)

Buscar en tipoServicio.descripcion una “Consulta” que contenga la especialidad y preferir variantes particulares/genéricas (no Club/ISSFA). Ordenar por más específico (longitud de descripcion).

Plantilla SQL (una línea):
SELECT ts.idTipoServicio,ts.codigo,ts.descripcion AS servicio,COALESCE(se.precioUnitario,ts.precioReferencial) AS precio
FROM tipoServicio ts
LEFT JOIN servicioEmpresa se ON se.idTipoServicio=ts.idTipoServicio AND se.idBioEmpresa=1
WHERE UPPER(ts.descripcion) LIKE 'CONSULTA%'
  AND UPPER(ts.descripcion) LIKE CONCAT('%',UPPER(:especialidad),'%')
  AND UPPER(ts.descripcion) NOT LIKE '%CLUB MEDICAL%'
  AND UPPER(ts.descripcion) NOT LIKE '%ISSFA%'
ORDER BY LENGTH(ts.descripcion) DESC
LIMIT 1;

Si pasas sede o variante, agrega filtros AND UPPER(ts.descripcion) LIKE CONCAT('%',UPPER(:sede),'%'), etc.

3.2 Precio Club Medical

Igual que arriba, pero exigiendo el token CLUB MEDICAL:
SELECT ts.idTipoServicio,ts.codigo,ts.descripcion AS servicio,COALESCE(se.precioUnitario,ts.precioReferencial) AS precio
FROM tipoServicio ts
LEFT JOIN servicioEmpresa se ON se.idTipoServicio=ts.idTipoServicio AND se.idBioEmpresa=1
WHERE UPPER(ts.descripcion) LIKE 'CONSULTA%'
  AND UPPER(ts.descripcion) LIKE CONCAT('%',UPPER(:especialidad),'%')
  AND UPPER(ts.descripcion) LIKE '%CLUB MEDICAL%'
ORDER BY LENGTH(ts.descripcion) DESC
LIMIT 1;

Salida común: idTipoServicio, codigo, servicio, precio.

Paso 4 — Lógica de los botones

Botón “Precio regular”: siempre permitido. Ejecuta consulta 3.1 y muestra precio.

Botón “Club Medical”:

Si es_miembro_club = 1: ejecutar 3.2 y mostrar precio.

Si es_miembro_club = 0: bloquear y devolver:
{
  "mensaje_bloqueo": "No eres Club Medical, suscríbete por tan solo $10 al año para precios preferenciales y recibe tu primera consulta de Medicina General gratuita",
  "link_inscripcion": "[ENLACE_CLUB_MEDICAL]"
}

Casos borde

Si no se encuentra un servicio exacto para la especialidad:

Relajar filtros (quitar sede/variante) y reintentar.

Si sigue sin match, devolver mensaje “Precio no disponible. Elige otra sede/variante o contacta recepción.”

Si idPersona no existe para la cédula dada: tratar como no miembro (permitir “regular”, bloquear “club”).

Acentos y mayúsculas: usa UPPER() y tokens en mayúsculas para los LIKE (collation por defecto suele ser case-insensitive; si necesitas acento-insensible, ajustar collation).

Contratos de función (sugeridos)
// Entrada desde UI
type PriceRequest = {
  cedula: string;
  especialidad: string;
  boton: "regular" | "club";
  sede?: string;
  variante?: string;
};

// Respuesta estándar
type PriceResponse =
  | { ok: true; es_miembro_club: 0 | 1; idTipoServicio: number; servicio: string; precio: number }
  | { ok: false; reason: "NO_CLUB"; mensaje_bloqueo: string; link_inscripcion: string }
  | { ok: false; reason: "NO_PRICE"; message: string };

Checklist de implementación
parámetros SQL bindeados (sin concatenar strings).
sin escrituras a BD.
timeouts y retry moderado.
logs discretos (sin exponer datos sensibles).
no alterar código existente; agregar como módulo aislado/función nueva.