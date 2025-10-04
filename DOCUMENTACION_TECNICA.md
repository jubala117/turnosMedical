# Documentación Técnica del Sistema de Kiosco - Medical&Care

## 1. Descripción General del Proyecto

### Propósito
El sistema de kiosco es una aplicación web para el agendamiento de citas médicas en Medical&Care. Permite a los pacientes particulares agendar sus citas a través de un kiosco físico o web.

### Arquitectura General
- **Cliente**: Aplicación web (kiosco.html) - Interfaz de usuario
- **Servidor**: API REST en PHP - Lógica de negocio
- **Base de Datos**: MySQL - Almacenamiento de datos
- **Entorno**: XAMPP con PHP 8+ y MySQL

### Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript ES6+, TailwindCSS
- **Backend**: PHP 8+ con PDO
- **Base de Datos**: MySQL
- **Seguridad**: PDO con consultas preparadas
- **Optimización**: Connection pooling

## 2. Estructura del Proyecto

### Organización de Archivos (ESTADO ACTUAL)
```
turnosMedical/
├── API/                          # Endpoints de la API
│   ├── verificar_paciente.php    # ✅ FUNCIONA - Verifica pacientes por cédula
│   ├── get_especialidades.php    # Especialidades médicas
│   ├── get_doctores.php          # Doctores por especialidad
│   ├── get_fechas.php            # Fechas disponibles por médico
│   ├── get_horas.php             # Horas disponibles por fecha/médico
│   └── get_examenes_eco.php      # Exámenes de ecografía
├── db_connect.inc.php            # ✅ FUNCIONA - Conexión a BD local
├── kiosco.html                   # ✅ FUNCIONA - Interfaz principal
├── images/                       # Imágenes de especialidades
├── test_conexion.php             # ✅ FUNCIONA - Script de diagnóstico
├── SOLUCION_PROBLEMA_KIOSCO.md   # Documentación de solución
└── Archivos de documentación
    ├── DOCUMENTACION_TECNICA.md  # Este archivo
    ├── ESTRUCTURA_BD.md          # Estructura de base de datos
    └── instrucciones.md          # Lógica de precios y Club Medical
```

### Flujo de Navegación
1. **Pantalla de cédula** - Ingreso de número de cédula
2. **Verificación de identidad** - API verificar_paciente.php
3. **Selección de especialidad** - API get_especialidades.php
4. **Selección de médico** - API get_doctores.php
5. **Selección de fecha** - API get_fechas.php
6. **Selección de hora** - API get_horas.php
7. **Confirmación y pago** - Pantalla final

## 3. Base de Datos - ENTORNO LOCAL

### Configuración Actual (LOCALHOST)
- **Servidor**: localhost
- **Base de Datos**: medicalcare
- **Usuario**: root
- **Contraseña**: (vacía)
- **Puerto**: 3306 (default)

### Archivo de Conexión (db_connect.inc.php)
```php
$gestor='mysql';
$dbname = 'medicalcare';
$usuario = 'root';
$pwd = '';
$host='localhost';
```

### Tablas Existentes Confirmadas
1. **persona** - Pacientes y personal
   - `idPersona` (PK), `cedula` (UNIQUE), `nombres`, `apellidos`
   - ✅ **IMPORTANTE**: Campo `idTipoPaciente` existe pero tabla `tipopaciente` NO existe

2. **especialidad** - Especialidades médicas
   - `idEspecialidad` (PK), `descEspecialidad`

3. **medico** - Información de médicos
   - `idMedico` (PK), relaciones con usuario y persona

4. **Otras tablas relevantes**:
   - `banco`, `dispensario`, `empresa`, `estadoplan`
   - `grupoexamen`, `grupoplan`, `perplanintegrante`
   - `personaplan`, `planbeneficio`, `plandescuento`
   - `relacion`, `servicioempresa`, `tipoespecialidad`
   - `tipoexamen`, `tipoexamenlab`, `tipopago`
   - `tipoplan`, `tiposervicio`

### Tablas NO Existentes (Importante)
- ❌ `tipopaciente` - Referenciada en código pero no existe en BD local
- ❌ `horario` - Referenciada pero no confirmada

### Relaciones Confirmadas
- `persona.idTipoPaciente` → ❌ Tabla destino no existe
- Consultas funcionan con estructura simplificada

## 4. APIs y Endpoints

### 1. verificar_paciente.php
- **Propósito**: Verificar si existe un paciente con la cédula proporcionada
- **Parámetros**: `cedula` (string)
- **Respuesta**:
```json
{
  "existe": true,
  "nombre": "Juan Pérez",
  "issfa": false
}
```

### 2. get_especialidades.php
- **Propósito**: Obtener las especialidades médicas disponibles
- **Parámetros**: `idDispensario` (fijo en 2)
- **Respuesta**:
```json
[
  {
    "idEspecialidad": 11,
    "descEspecialidad": "GINECOLOGÍA"
  }
]
```

### 3. get_doctores.php
- **Propósito**: Obtener médicos disponibles para una especialidad
- **Parámetros**: `idEspecialidad`
- **Respuesta**:
```json
[
  {
    "idMedico": 1,
    "nombreCompleto": "Dr. Carlos Mendoza"
  }
]
```

### 4. get_fechas.php
- **Propósito**: Obtener fechas con turnos disponibles para un médico
- **Parámetros**: `idMedico`
- **Respuesta**:
```json
[
  {
    "fechaHorario": "2025-09-23"
  }
]
```

### 5. get_horas.php
- **Propósito**: Obtener horas disponibles para una fecha y médico
- **Parámetros**: `idMedico`, `fecha`
- **Respuesta**:
```json
[
  {
    "idHorarioMedico": 123,
    "hora": "10:00"
  }
]
```

## 5. Frontend - Kiosco

### Interfaz de Usuario
- **Pantalla de cédula**: Ingreso de número de cédula
- **Pantalla de especialidades**: Seleccionar especialidad
- **Pantalla de médicos**: Seleccionar médico
- **Pantalla de fechas**: Seleccionar fecha
- **Pantalla de horas**: Seleccionar hora
- **Pantalla de pago**: Confirmación de cita

### Flujo de Trabajo
1. Ingreso de cédula
2. Verificación de identidad
3. Selección de especialidad
4. Selección de médico
5. Selección de fecha
6. Selección de hora
7. Confirmación de cita

### Manejo de Estados
- **Pantallas**: Se muestran/ocultan según el flujo
- **Datos temporales**: Se guardan en variables de JavaScript
- **Navegación**: Se maneja con funciones JS
- **Validación**: Se hace antes de cada paso

## 6. APIs - Estado Actual y Funcionalidad

### 1. verificar_paciente.php ✅ **FUNCIONA CORRECTAMENTE**
- **URL**: `http://localhost/turnosMedical/API/verificar_paciente.php?cedula=0502417025`
- **Consulta actual** (simplificada por falta de tabla tipopaciente):
```sql
SELECT idPersona, CONCAT(nombres, ' ', apellidos) AS nombreCompleto, idTipoPaciente
FROM persona WHERE cedula = ?
```
- **Respuesta de ejemplo**:
```json
{
  "existe": true,
  "idPersona": 18593,
  "nombre": "JENNY VERONICA RIVERA CUNALATA",
  "issfa": false
}
```

### 2. Configuración de Base de Datos - LOCALHOST

### Archivo de Conexión: db_connect.inc.php
- **Configuración ACTUAL**:
```php
$gestor='mysql';
$dbname = 'medicalcare';
$usuario = 'root';
$pwd = '';
$host='localhost';
```

### Protección contra Inyección SQL
- **Consultas preparadas** en todas las APIs ✅ Implementado
- **PDO con parámetros bindeados** ✅ Implementado
- **Connection pooling** ✅ Implementado
- **Manejo de excepciones** ✅ Implementado

### Validación de Datos
- **Verificación de cédula** en `verificar_paciente.php` ✅ Funciona
- **Sanitización de entrada** en todos los endpoints ✅ Implementado

## 7. Funcionalidades Especiales

### Detección de Pacientes ISSFA
- **Campo**: `pacienteISSFA` en la respuesta
- **Lógica**: Si es 'S', se muestra alerta especial
- **Redirección**: A la ventanilla en lugar de al kiosco

### Protección contra Inyección SQL
- **Consultas preparadas** en todas las APIs
- **bindParam** para todos los parámetros de entrada
- **Filtrado de entrada** en todas las APIs
- **Manejo de errores** en la conexión

### Optimizaciones
- **Connection pooling** en `db_connect.inc.php`
- **Consultas optimizadas** en `get_doctores.php`
- **Uso eficiente de memoria** en todas las APIs
- **Caché de conexión** para optimizar rendimiento

## 8. Posibles Mejoras Futuras

### Seguridad
- **Autenticación JWT** para las APIs
- **Validación más estricta** de parámetros
- **Registros de auditoría** para acciones críticas

### Rendimiento
- **Caché de resultados** para datos que no cambian frecuentemente
- **Consultas paginadas** para grandes conjuntos de datos
- **Indexación de tablas** para consultas más rápidas

### Usabilidad
- **Soporte para impresión de comprobante**
- **Integración con sistema de pago**
- **Soporte para múltiples idiomas**

### Arquitectura
- **Desacoplar lógica de datos y presentación**
- **Crear un sistema de logs más completo**
- **Implementar pruebas automatizadas**

### Escalabilidad
- **Migrar a un framework PHP** (como Lumen)
- **Implementar API Gateway**
- **Crear microservicios por funcionalidad**

## 9. Diagramas y Flujos

### Diagrama de Arquitectura
```
[Browser] → [APIs] → [Base de Datos]
```

### Flujo de Trabajo
```
Ingreso de cédula → Verificación → Selección de especialidad → Selección de médico →
Selección de fecha → Selección de hora → Confirmación de cita
```

### Flujo de Seguridad
```
Ingreso de cédula → Validación → Consulta preparada → Respuesta sanitizada
```

## 10. Consideraciones Finales

### Estado Actual del Sistema
- **Funcional**: Sí, con todas las APIs respondiendo correctamente
- **Seguro**: Sí, con consultas preparadas y validación de entrada
- **Rendimiento**: Bien optimizado con connection pooling

### Recomendaciones para Mantenimiento
- **Monitoreo de errores**: Implementar sistema de logs
- **Backups regulares**: De la base de datos
- **Actualización de dependencias**: PHP, MySQL, bibliotecas frontend

### Consideraciones de Seguridad
- **Protección contra inyección SQL**: Implementada con consultas preparadas
- **Protección contra XSS**: Implementada con `htmlspecialchars`
- **Protección contra CSRF**: Implementar en futuras versiones
- **Validación de entrada**: Implementada en todas las APIs

### Notas de Implementación
- **Todas las APIs devuelven JSON**
- **Se usa PDO para conexión a base de datos**
- **Se usa TailwindCSS para estilado**
- **Se usa JavaScript moderno con módulos**

### Recomendaciones para Futuras Optimizaciones
- **Implementar autenticación JWT**
- **Crear sistema de logs**
- **Implementar paginación en APIs**
- **Migrar a un framework PHP**
