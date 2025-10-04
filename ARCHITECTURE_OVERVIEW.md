# Arquitectura del Sistema - Medical&Care Kiosco

## Resumen Ejecutivo

**Sistema de agendamiento de citas médicas** que permite a pacientes particulares reservar turnos a través de un kiosco web. El sistema identifica pacientes existentes por cédula y guía a través de un flujo de selección de especialidad, médico, fecha y hora.

## Diagrama de Arquitectura

```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐    SQL Queries    ┌─────────────────┐
│   Frontend      │ ◄─────────────► │   API PHP       │ ◄─────────────► │   Base de       │
│   (kiosco.html) │                 │   (Endpoints)   │                 │   Datos MySQL   │
│                 │                 │                 │                 │   (medicalcare) │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
        │                                  │                                      │
        │                                  │                                      │
        ▼                                  ▼                                      ▼
   Interfaz de usuario              Lógica de negocio                       Almacenamiento
   TailwindCSS + JS                 PDO + Consultas preparadas              Tablas relacionales
```

## Componentes Principales

### 1. Frontend (Cliente)
- **Archivo**: `kiosco.html`
- **Tecnologías**: HTML5, CSS3 (TailwindCSS), JavaScript ES6+
- **Responsabilidades**:
  - Interfaz de usuario para agendamiento
  - Navegación entre pantallas
  - Consumo de APIs REST
  - Validación de entrada del usuario

### 2. Backend (API)
- **Ubicación**: Directorio `API/`
- **Tecnologías**: PHP 8+, PDO para base de datos
- **Endpoints principales**:
  - `verificar_paciente.php` - ✅ **FUNCIONAL**
  - `get_especialidades.php` - Por verificar
  - `get_doctores.php` - Por verificar
  - `get_fechas.php` - Por verificar
  - `get_horas.php` - Por verificar

### 3. Base de Datos
- **Nombre**: `medicalcare`
- **Motor**: MySQL
- **Conexión**: Localhost (XAMPP)
- **Configuración**: `db_connect.inc.php`

## Flujo de Datos

### Flujo Principal - Agendamiento de Cita
```
1. INGRESO CÉDULA → 2. VERIFICACIÓN → 3. ESPECIALIDAD → 4. MÉDICO → 5. FECHA → 6. HORA → 7. CONFIRMACIÓN
    │                  │                  │               │           │         │           │
    │                  │                  │               │           │         │           │
    ▼                  ▼                  ▼               ▼           ▼         ▼           ▼
kiosco.html   verificar_paciente.php  get_especialidades  get_doctores get_fechas get_horas  Pantalla final
```

### Flujo Técnico Detallado
```javascript
// 1. Usuario ingresa cédula
cedulaInput.addEventListener('keypress/click') → verificarCedula()

// 2. Verificación en backend
fetch(`/API/verificar_paciente.php?cedula=${cedula}`)
→ Consulta SQL: SELECT FROM persona WHERE cedula = ?
→ Respuesta JSON: {existe: true, idPersona: X, nombre: "..."}

// 3. Carga de especialidades
fetch(`/API/get_especialidades.php?idPersona=${currentPatientId}`)
→ Muestra grid de especialidades con precios

// 4-6. Flujo de selección similar para médicos, fechas, horas
```

## Estructura de Datos Clave

### Tabla `persona` (Pacientes)
```sql
idPersona (PK) | cedula (UNIQUE) | nombres | apellidos | idTipoPaciente
```

### Relaciones Importantes
- `persona` → Consultas por cédula (funciona)
- `especialidad` → Catálogo de especialidades
- `medico` → Información de doctores
- `servicioEmpresa` → Precios (idBioEmpresa = 1)

## Estado Actual del Sistema

### ✅ Componentes Funcionales
1. **Conexión a BD**: `db_connect.inc.php` funciona correctamente
2. **Verificación de pacientes**: `verificar_paciente.php` operativo
3. **Frontend básico**: `kiosco.html` carga y funciona
4. **Infraestructura**: XAMPP con PHP 8+ y MySQL

### ⚠️ Componentes por Verificar
1. **APIs secundarias**: `get_especialidades.php`, `get_doctores.php`, etc.
2. **Lógica de precios**: Integración con Club Medical
3. **Flujo completo**: Desde cédula hasta confirmación

### ❌ Problemas Conocidos
1. **Tabla faltante**: `tipopaciente` no existe (afecta detección ISSFA)
2. **Estructura incompleta**: Algunas relaciones de BD no están implementadas

## Configuración Técnica

### Entorno de Desarrollo
- **Servidor web**: Apache (XAMPP)
- **PHP**: 8+ (probado con XAMPP)
- **Base de datos**: MySQL 5.7+/8.0+
- **Directorio raíz**: `c:/xampp/htdocs/turnosMedical/`

### URLs de Acceso
- **Kiosco**: `http://localhost/turnosMedical/kiosco.html`
- **API ejemplo**: `http://localhost/turnosMedical/API/verificar_paciente.php?cedula=0502417025`

## Consideraciones de Seguridad

### Implementadas
- ✅ Consultas preparadas con PDO
- ✅ Sanitización de entrada
- ✅ Validación de parámetros
- ✅ Manejo de excepciones

### Pendientes
- ❌ Autenticación JWT
- ❌ Rate limiting
- ❌ Logs de auditoría

## Próximos Pasos Recomendados

### Corto Plazo (Crítico)
1. Verificar funcionamiento de APIs secundarias
2. Completar flujo de agendamiento completo
3. Implementar lógica de precios Club Medical

### Medio Plazo (Mejoras)
1. Crear tabla `tipopaciente` para funcionalidad ISSFA
2. Implementar sistema de logs
3. Agregar validaciones adicionales

### Largo Plazo (Evolución)
1. Migrar a framework PHP (Lumen/Laravel)
2. Implementar autenticación JWT
3. Crear panel administrativo

## Archivos de Diagnóstico Disponibles

- `test_conexion.php` - Verificación de conexión a BD
- `check_database_structure.php` - Estructura de tablas
- `SOLUCION_PROBLEMA_KIOSCO.md` - Resolución de problema reciente

## Notas Importantes

- El sistema funciona correctamente para verificación básica de pacientes
- La base de datos local contiene datos reales de prueba
- El frontend está optimizado para uso en kiosco (interfaz touch-friendly)
- Todas las APIs devuelven JSON estándar para fácil integración
