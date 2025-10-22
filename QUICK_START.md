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
│   ├── get_examenes_eco.php      # ✅ OPTIMIZADO (N+1 fix)
│   ├── utils.php                 # ✅ NUEVO - Utilidades compartidas
│   ├── get_especialidades.php    # Por verificar
│   └── ... más APIs
├── js/                           # Módulos JavaScript
│   ├── api.js                    # ✅ OPTIMIZADO - Sin duplicación
│   ├── utils.js                  # ✅ OPTIMIZADO - Memoización
│   ├── toast.js                  # ✅ NUEVO - Notificaciones
│   ├── loading.js                # ✅ NUEVO - Estados de carga
│   └── eventManager.js           # ✅ NUEVO - Gestión de eventos
├── css/                          # Estilos
│   ├── input.css                 # Fuente TailwindCSS
│   └── output.css                # ✅ COMPILADO - 14KB (antes 3MB)
├── kiosco.html                   # ✅ OPTIMIZADO - Accesibilidad WCAG 2.1
├── db_connect.inc.php            # ✅ OPTIMIZADO - Variables de entorno
├── database/
│   └── optimize_indexes.sql      # ✅ NUEVO - Optimización BD
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

## 🧪 Testing de Funcionalidades (Consola del Navegador)

### Probar Sistema de Notificaciones Toast
```javascript
// Toast de éxito
ToastNotification.success('¡Operación exitosa!');

// Toast de error
ToastNotification.error('Ha ocurrido un error');

// Toast de advertencia
ToastNotification.warning('Ten cuidado con esto');

// Toast de información
ToastNotification.info('Información importante', 5000); // 5 segundos
```

### Probar Estados de Carga
```javascript
// Mostrar loading
const loaderId = LoadingState.show('Procesando datos...');

// Ocultar después de 3 segundos
setTimeout(() => LoadingState.hide(loaderId), 3000);

// Usar con función async
LoadingState.withLoading(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Tarea completada');
}, 'Ejecutando tarea...');
```

### Verificar Memoización de Búsqueda
```javascript
// Primera búsqueda (sin cache)
console.time('Primera búsqueda');
Utils.calcularDistanciaLevenshtein('cardiologia', 'cardiología');
console.timeEnd('Primera búsqueda');

// Segunda búsqueda (con cache)
console.time('Segunda búsqueda');
Utils.calcularDistanciaLevenshtein('cardiologia', 'cardiología');
console.timeEnd('Segunda búsqueda'); // Debería ser más rápida

// Limpiar cache
Utils.clearLevenshteinCache();
```

### Verificar Event Manager
```javascript
// Ver listeners registrados
console.log('Global listeners:', EventManager.globalListeners.length);
console.log('Element listeners:', EventManager.listeners.size);

// Agregar listener gestionado
const button = document.querySelector('button');
const removeListener = addManagedListener(button, 'click', () => {
    console.log('Click detectado');
});

// Remover listener
removeListener();
```

### Verificar Cache de API
```javascript
// Ver estadísticas del cache
console.log('Cache hits:', ApiService.cacheHits);
console.log('Cache misses:', ApiService.cacheMisses);
console.log('Cache hit rate:',
    (ApiService.cacheHits / (ApiService.cacheHits + ApiService.cacheMisses) * 100).toFixed(2) + '%'
);

// Limpiar cache
ApiService.clearCache();
```

## 🎯 Próximos Pasos Sugeridos

### ✅ Completado
- **Fase 1**: Optimizaciones críticas (N+1 fix, CSS compilado, accesibilidad)
- **Fase 2**: UX avanzada (toast, loading, event manager, memoización)

### 🔄 Fase 3 - PWA y Funcionalidades Avanzadas (Siguiente)
1. **Progressive Web App**
   - Service Worker para cache offline
   - Manifest.json para instalación
   - App-like experience

2. **Búsqueda Avanzada**
   - Índice reverso de sinónimos
   - Sistema de clasificación genérico
   - Búsqueda fuzzy mejorada

3. **Monitoreo**
   - Performance monitoring
   - Error tracking
   - Analytics de uso

### Prioridad Alta (Funcionalidad)
1. Verificar funcionamiento de `get_especialidades.php`
2. Probar flujo completo de agendamiento
3. Implementar lógica de precios Club Medical

### Prioridad Media (Mejoras)
1. Crear tabla `tipopaciente` para ISSFA
2. Agregar validaciones adicionales
3. Implementar rate limiting

### Prioridad Baja (Arquitectura)
1. Migrar a framework PHP (Lumen/Laravel)
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
