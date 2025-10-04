# Estructura de la Base de Datos - Medical&Care

## Estado Actual - Entorno Local

**Base de datos**: `medicalcare` (localhost)  
**Usuario**: `root` (sin contraseña)  
**Estado**: ✅ **OPERATIVA** con datos de prueba reales

## Verificación de Tablas Existentes

### ✅ Tablas Confirmadas (Ejecutado: `check_database_structure.php`)
```
banco
dispensario
empresa
especialidad
estadoplan
grupoexamen
grupoplan
perplanintegrante
persona
personaplan
planbeneficio
plandescuento
relacion
servicioempresa
tipoespecialidad
tipoexamen
tipoexamenlab
tipopago
tipoplan
tiposervicio
```

### ❌ Tablas NO Existentes (Importante)
- `tipopaciente` - Referenciada en código pero no existe
- `horario` - Referenciada pero no confirmada

## Diagrama Conceptual de Flujo de Datos

- **Agendamiento de Cita:**
  `Paciente` → `Especialidad` → `Médico` → `Fecha/Hora` → `Cita`

- **Cálculo de Precios:**
  `Paciente` + `Especialidad` → `Plan (Club Medical)` → `Precio`

- **Catálogo de Servicios:**
  `TipoServicio` (Precio base) ← `ServicioEmpresa` (Precio final)

## Descripción de Tablas Principales (ESTADO REAL)

### 1. Tablas de Pacientes y Personal

- **`persona`**
  - **Propósito:** Almacena la información de todas las personas en el sistema, incluyendo pacientes y personal médico.
  - **Columnas Clave:**
    - `idPersona` (PK): Identificador único.
    - `cedula` (UNIQUE): Cédula de identidad, usada para buscar y verificar pacientes.
    - `nombres`, `apellidos`: Nombre completo de la persona.

- **`medico`**
  - **Propósito:** Contiene información específica de los médicos.
  - **Relación:** Se vincula con la tabla `persona` (a través de la tabla `usuario`) para obtener los datos personales del médico, como su nombre.

### 2. Tablas de Agendamiento

- **`especialidad`**
  - **Propósito:** Catálogo de las especialidades médicas ofrecidas.
  - **Columnas Clave:**
    - `idEspecialidad` (PK): Identificador único.
    - `descEspecialidad`: Nombre de la especialidad (ej. "GINECOLOGÍA").

- **`horario` y `horarioMedico`**
  - **Propósito:** Gestionan la disponibilidad de los médicos.
  - **Relación:**
    - La tabla `horario` define los bloques de fecha y hora.
    - `horarioMedico` conecta a un `idMedico` con un `idHorario` para indicar que un médico está disponible en esa franja horaria.

### 3. Tablas de Servicios y Precios (¡MUY IMPORTANTE!)

Este es el núcleo de cómo se calculan los precios en el sistema.

- **`tipoServicio`**
  - **Propósito:** Es el **catálogo maestro** de todos los servicios, ya sean consultas, exámenes o procedimientos.
  - **Columnas Clave:**
    - `idTipoServicio` (PK): Identificador único del servicio.
    - `descripcion`: Nombre o detalle del servicio (ej. "Consulta Medicina General Particular").
    - `precioReferencial`: Un precio base o de referencia. **Este precio puede no ser el final.**

- **`servicioEmpresa`**
  - **Propósito:** Esta tabla es **crucial**, ya que **sobrescribe los precios** de la tabla `tipoServicio` para una empresa específica. Para Medical&Care, se usa siempre `idBioEmpresa = 1`.
  - **Relación y Lógica:**
    - Se vincula directamente con `tipoServicio` a través de `idTipoServicio`.
    - Cuando se busca el precio de un servicio, el sistema **primero** busca una entrada en `servicioEmpresa` que coincida con el `idTipoServicio` y `idBioEmpresa = 1`.
    - Si existe, el precio final es el de `servicioEmpresa.precioUnitario`.
    - Si **no** existe una entrada en esta tabla, entonces se utiliza el `precioReferencial` de la tabla `tipoServicio`.

- **`tipoExamenLab`**
  - **Propósito:** Contiene un catálogo detallado de todos los exámenes de laboratorio disponibles.
  - **Columnas Clave:**
    - `idTipoExamenLab` (PK): Identificador único del examen.
    - `descTipoExamen`: Nombre del examen.
    - `precioUnitario`: Precio del examen.
    - `idGrupoExamen` (FK): Lo agrupa en categorías como "IMAGEN", "LABORATORIO", etc.

### 4. Tablas de Planes (Club Medical)

- **`grupoPlan`**
  - **Propósito:** Define los planes de membresía. El "Club Medical" está definido aquí.
  - **Columnas Clave:**
    - `idGrupoPlan` (PK): Identificador del plan. Actualmente, **Club Medical es el ID 7**.
    - `descripcion`: Nombre del plan (ej. "Club Medical").

- **`personaPlan`**
  - **Propósito:** Registra la afiliación de un titular a un plan.
  - **Relación:** Conecta `persona.idPersona` con `grupoPlan.idGrupoPlan`. Contiene las fechas de vigencia y el estado del plan.

- **`perPlanIntegrante`**
  - **Propósito:** Permite añadir beneficiarios o integrantes familiares a un plan ya existente (`idPersonaPlan`).

## Problemas Conocidos y Soluciones

### ❌ Problema: Tabla `tipopaciente` No Existe
- **Descripción**: El campo `persona.idTipoPaciente` referencia una tabla que no existe en la BD local
- **Impacto**: La funcionalidad de detección ISSFA no funciona correctamente
- **Solución Implementada**: Consulta simplificada en `verificar_paciente.php`
```sql
-- Consulta original (no funciona):
SELECT p.idPersona, CONCAT(p.nombres, ' ', p.apellidos), tp.pacienteISSFA
FROM persona p LEFT JOIN tipoPaciente tp ON p.idTipoPaciente = tp.idTipoPaciente

-- Consulta actual (funciona):
SELECT idPersona, CONCAT(nombres, ' ', apellidos) AS nombreCompleto, idTipoPaciente
FROM persona WHERE cedula = ?
```

### ✅ Estado Actual de Consultas
- **Verificación de pacientes**: ✅ **FUNCIONAL** con cédula `0502417025`
- **Estructura básica**: ✅ **OPERATIVA** para flujo principal
- **Precios Club Medical**: ⚠️ **POR VERIFICAR** (ver `instrucciones.md`)

## Recomendaciones para Desarrollo

### Próximos Pasos
1. **Verificar APIs secundarias**: `get_especialidades.php`, `get_doctores.php`, etc.
2. **Implementar lógica de precios**: Seguir instrucciones en `instrucciones.md`
3. **Crear tabla `tipopaciente`**: Para funcionalidad ISSFA completa

### Scripts de Diagnóstico Disponibles
- `test_conexion.php` - Verificación de conexión y datos
- `check_database_structure.php` - Estructura de tablas
- `SOLUCION_PROBLEMA_KIOSCO.md` - Documentación completa del problema resuelto
