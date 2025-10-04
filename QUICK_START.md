# Guía Rápida - Medical&Care Kiosco

## 🚀 Inicio Rápido para Desarrolladores

Esta guía te ayudará a configurar y entender rápidamente el proyecto del kiosco de Medical&Care.

## Prerrequisitos

- **XAMPP** instalado y funcionando
- **PHP 8+** (incluido en XAMPP)
- **MySQL** (incluido en XAMPP)
- Navegador web moderno

## Configuración en 3 Pasos

### 1. Verificar XAMPP
```bash
# Iniciar XAMPP Control Panel
# Asegurarse que Apache y MySQL estén en ejecución
```

### 2. Acceder al Proyecto
- **URL del kiosco**: `http://localhost/turnosMedical/kiosco.html`
- **Directorio local**: `c:/xampp/htdocs/turnosMedical/`

### 3. Probar Funcionalidad Básica
1. Abrir `http://localhost/turnosMedical/kiosco.html`
2. Ingresar cédula: `0502417025`
3. Verificar que aparece "JENNY VERONICA RIVERA CUNALATA"

## 📁 Estructura del Proyecto

```
turnosMedical/
├── API/                          # Endpoints principales
│   ├── verificar_paciente.php    # ✅ FUNCIONAL
│   ├── get_especialidades.php    # Por verificar
│   └── ... más APIs
├── kiosco.html                   # Interfaz principal
├── db_connect.inc.php            # Conexión a BD local
└── Archivos de diagnóstico/
    ├── test_conexion.php         # Verificar BD
    └── check_database_structure.php # Estructura de tablas
```

## 🔧 Diagnóstico Rápido

### Verificar Conexión a Base de Datos
```bash
# Ejecutar en terminal desde el directorio del proyecto
C:\xampp\php\php.exe test_conexion.php
```

### Probar API Directamente
```bash
# Probar verificación de paciente
C:\xampp\php\php.exe test_api_verificacion.php
```

### Verificar Estructura de BD
```bash
# Listar tablas existentes
C:\xampp\php\php.exe check_database_structure.php
```

## 🐛 Solución de Problemas Comunes

### Problema: "Paciente no encontrado"
**Causa**: API `verificar_paciente.php` no devuelve JSON correcto
**Solución**: Verificar que el archivo no tenga código de depuración

### Problema: Error de conexión a BD
**Causa**: Configuración incorrecta en `db_connect.inc.php`
**Solución**: Verificar que use `localhost` y usuario `root` sin contraseña

### Problema: APIs secundarias no funcionan
**Causa**: Tablas faltantes o consultas incorrectas
**Solución**: Revisar `ESTRUCTURA_BD.md` para ver tablas existentes

## 📊 Datos de Prueba

### Cédulas de Prueba Confirmadas
- `0502417025` - JENNY VERONICA RIVERA CUNALATA ✅ **FUNCIONAL**
- (Agregar más según necesidad)

### Estructura de BD Local
- **Base de datos**: `medicalcare`
- **Usuario**: `root` (sin contraseña)
- **Tablas**: 20 tablas confirmadas (ver `ESTRUCTURA_BD.md`)

## 🔄 Flujo de Desarrollo

### Para Modificar una API
1. Hacer backup del archivo original
2. Modificar el código PHP
3. Probar con script de diagnóstico
4. Verificar en el kiosco

### Para Agregar Nueva Funcionalidad
1. Revisar `ARCHITECTURE_OVERVIEW.md` para entender arquitectura
2. Consultar `ESTRUCTURA_BD.md` para estructura de datos
3. Seguir patrones existentes en otras APIs

## 📚 Documentación Relacionada

- **`DOCUMENTACION_TECNICA.md`** - Documentación técnica completa
- **`ARCHITECTURE_OVERVIEW.md`** - Arquitectura del sistema
- **`ESTRUCTURA_BD.md`** - Estructura de base de datos
- **`instrucciones.md`** - Lógica de precios y Club Medical
- **`SOLUCION_PROBLEMA_KIOSCO.md`** - Resolución de problema reciente

## ⚡ Comandos Útiles

### Reiniciar Servicios
```bash
# Desde XAMPP Control Panel: Stop/Start Apache y MySQL
```

### Ver Logs de PHP
```bash
# Logs de Apache/PHP en XAMPP
C:\xampp\php\logs\
```

### Ver Logs de MySQL
```bash
# Logs de MySQL en XAMPP
C:\xampp\mysql\data\
```

## 🎯 Próximos Pasos Sugeridos

### Prioridad Alta
1. Verificar funcionamiento de `get_especialidades.php`
2. Probar flujo completo de agendamiento
3. Implementar lógica de precios Club Medical

### Prioridad Media
1. Crear tabla `tipopaciente` para ISSFA
2. Implementar sistema de logs
3. Agregar validaciones adicionales

### Prioridad Baja
1. Migrar a framework PHP
2. Implementar autenticación JWT
3. Crear panel administrativo

## 📞 Soporte y Diagnóstico

### Scripts de Diagnóstico Disponibles
- `test_conexion.php` - Conexión y datos básicos
- `test_api_verificacion.php` - Prueba de API
- `check_database_structure.php` - Estructura de BD

### Verificación Rápida de Estado
```bash
# Ejecutar todos los tests básicos
C:\xampp\php\php.exe test_conexion.php
C:\xampp\php\php.exe test_api_verificacion.php
C:\xampp\php\php.exe check_database_structure.php
```

## ✅ Checklist de Configuración

- [ ] XAMPP instalado y funcionando
- [ ] Apache y MySQL ejecutándose
- [ ] Proyecto en `c:/xampp/htdocs/turnosMedical/`
- [ ] Kiosco accesible en `http://localhost/turnosMedical/kiosco.html`
- [ ] API `verificar_paciente.php` funcionando
- [ ] Base de datos `medicalcare` con datos

¡Listo para desarrollar! 🚀
