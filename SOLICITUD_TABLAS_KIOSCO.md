# Solicitud de Tablas para Kiosco Medical&Care

## Propósito
Este documento especifica las tablas necesarias para completar la funcionalidad del kiosco de agendamiento de citas, integrando la lógica existente de verificación ISSFA y Club Medical.

## Estado Actual del Kiosco

### ✅ Funcionalidades Operativas:
- **Verificación de pacientes**: API `verificar_paciente.php` funciona correctamente
- **Base de datos local**: Conexión establecida con datos de prueba
- **Interfaz kiosco**: `kiosco.html` cargando correctamente
- **Lógica Club Medical**: Código existente en `get_especialidades.php`

### ❌ Funcionalidades Bloqueadas por Falta de Tablas:
- **Detección ISSFA**: No funciona (falta tabla `tipoPaciente`)
- **Listado de médicos**: Error al cargar (faltan tablas de médicos)
- **Fechas y horarios**: No disponibles (faltan tablas de horarios)

## Tablas Solicitadas

### 🔴 Tablas CRÍTICAS (Sin estas NO funciona el kiosco):

#### 1. `tipoPaciente` - **PRIORIDAD MÁXIMA**
**Propósito**: Determinar si un paciente es ISSFA o particular
**Uso en flujo actual**:
```sql
-- En verificar_paciente.php (actualmente no funciona)
SELECT p.idPersona, CONCAT(p.nombres, ' ', p.apellidos), tp.pacienteISSFA
FROM persona p LEFT JOIN tipoPaciente tp ON p.idTipoPaciente = tp.idTipoPaciente
WHERE p.cedula = ?
```

**Campos esperados**:
- `idTipoPaciente` (PK)
- `descripcion` (ej: "Particular", "ISSFA")
- `pacienteISSFA` (S/N)

#### 2. `medico` - Para listado de doctores
**Propósito**: Información de médicos y sus especialidades
**Uso en**: `get_doctores.php`, `get_fechas.php`, `get_horas.php`

**Campos esperados**:
- `idMedico` (PK)
- `idUsuario` (FK a usuario)
- `codigoProfesional`

#### 3. `usuario` - Sistema de usuarios
**Propósito**: Usuarios del sistema (médicos, personal)
**Relación**: Conecta `medico` con `persona`

**Campos esperados**:
- `idUsuario` (PK)
- `idPersona` (FK a persona)
- `idEstado`

#### 4. `usuarioDispensario` - Relaciones médico-dispensario
**Propósito**: Especifica en qué dispensarios y especialidades trabaja cada médico

**Campos esperados**:
- `idUsuario` (FK)
- `idDispensario` (FK)
- `idEspecialidad` (FK)

#### 5. `horario` - Fechas disponibles
**Propósito**: Catálogo de fechas y horas para citas

**Campos esperados**:
- `idHorario` (PK)
- `fechaHorario` (DATE)
- `hora` (TIME)

#### 6. `horarioMedico` - Horarios específicos por médico
**Propósito**: Disponibilidad horaria de cada médico

**Campos esperados**:
- `idHorarioMedico` (PK)
- `idMedico` (FK)
- `idHorario` (FK)
- `idEstado` (disponible/ocupado)

#### 7. `personaHorMd` - Citas agendadas
**Propósito**: Registro de citas confirmadas

**Campos esperados**:
- `idPersonaHorMd` (PK)
- `idPersona` (FK)
- `idHorarioMedico` (FK)

## Integración con Lógica Existente

### Flujo de Verificación Completo que Implementaremos:

#### Paso 1: Verificación ISSFA (NUEVO)
```php
// En verificar_paciente.php - Una vez tengamos tipoPaciente
function verificarTipoPaciente($conn, $idPersona) {
    $sql = "SELECT tp.pacienteISSFA 
            FROM persona p 
            LEFT JOIN tipoPaciente tp ON p.idTipoPaciente = tp.idTipoPaciente 
            WHERE p.idPersona = ?";
    // Si pacienteISSFA = 'S' → Redirigir a ventanilla
}
```

#### Paso 2: Verificación Club Medical (EXISTENTE - YA FUNCIONA)
```php
// Código actual en get_especialidades.php - FUNCIONAL
function verificarMembresiaClubMedical($conn, $idPersona) {
    // Usa tablas personaPlan y perPlanIntegrante que YA EXISTEN
    $idGrupoPlanClub = 7; // Club Medical
    
    $sql = "SELECT (EXISTS(...) OR EXISTS(...)) AS es_miembro_club";
    // Retorna true/false según membresía
}
```

#### Paso 3: Flujo de Decisiones
```
Ingreso cédula → Verificar paciente
    ↓
¿Es ISSFA? (usando tipoPaciente)
    ↓
SÍ → Mostrar: "Paciente ISSFA, acérquese a ventanilla"
    ↓
NO → Verificar Club Medical (usando personaPlan/perPlanIntegrante)
    ↓
¿Es Club Medical? → Mostrar precios preferenciales
    ↓
NO → Mostrar precios preferenciales + precios particulares (si da click en algun precio de club medical se le da la opción de inscripción, similar a la logica actual)
```

## Estructura de Datos Esperada

### Relaciones Clave que Deben Existir:
```
persona (EXISTE)
    ↓ idTipoPaciente → tipoPaciente (FALTANTE)
    ↓ idPersona → usuario (FALTANTE) → medico (FALTANTE)
        ↓ idUsuario → usuarioDispensario (FALTANTE)
            ↓ idEspecialidad → especialidad (EXISTE)
            ↓ idDispensario → dispensario (EXISTE)

medico (FALTANTE)
    ↓ idMedico → horarioMedico (FALTANTE)
        ↓ idHorario → horario (FALTANTE)
        ↓ idHorarioMedico → personaHorMd (FALTANTE)
            ↓ idPersona → persona (EXISTE)
```

## Pruebas de Integración

### Una vez Disponibles las Tablas, Verificaremos:

1. **Verificación ISSFA**:
   - Paciente con `pacienteISSFA = 'S'` → Mensaje ventanilla
   - Paciente con `pacienteISSFA = 'N'` → Continuar flujo
   - Paciente con `pacienteISSFA = 'S' + clubMedical = 'S'` → Continuar flujo

2. **Listado de Médicos**:
   - API `get_doctores.php` debe devolver lista de médicos
   - Filtrado por especialidad y dispensario

3. **Fechas y Horarios**:
   - API `get_fechas.php` debe devolver fechas disponibles
   - API `get_horas.php` debe devolver horarios específicos

4. **Flujo Completo**:
   - Cédula → Verificación → Especialidad → Médico → Fecha → Hora → Confirmación

## Impacto en el Sistema

### Con estas tablas, el kiosco tendrá:
- ✅ **Detección automática de ISSFA** (redirección a ventanilla)
- ✅ **Verificación Club Medical** (precios diferenciados)
- ✅ **Listado completo de médicos** por especialidad
- ✅ **Disponibilidad de fechas y horarios** en tiempo real
- ✅ **Sistema idéntico al WhatsApp** (misma lógica de negocio)

### Sin estas tablas, el kiosco está limitado a:
- ❌ Solo verificación básica de pacientes
- ❌ Sin detección ISSFA (todos tratados como particulares)
- ❌ Sin listado de médicos (flujo interrumpido)
- ❌ Sin agendamiento real de citas

## Solicitud Específica

**Se solicita acceso a las siguientes 7 tablas**:
1. `tipoPaciente` - Para detección ISSFA
2. `medico` - Información de médicos
3. `usuario` - Sistema de usuarios
4. `usuarioDispensario` - Relaciones médico-dispensario
5. `horario` - Fechas disponibles
6. `horarioMedico` - Horarios por médico
7. `personaHorMd` - Citas agendadas

**Justificación**: Estas tablas son necesarias para completar el flujo de agendamiento del kiosco, utilizando la misma lógica de negocio que ya funciona en el sistema de WhatsApp.

---

**Fecha de solicitud**: 26 de Septiembre, 2025  
**Estado**: 🔴 **ESPERANDO ACCESO A TABLAS**
