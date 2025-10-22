# Configuración del Proyecto - turnosMedical

## Configuración de Base de Datos

### Paso 1: Crear archivo .env

El proyecto ahora utiliza variables de entorno para mayor seguridad.

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

### Paso 2: Configurar credenciales

Editar `.env` con tus credenciales locales:

```env
DB_DRIVER=mysql
DB_HOST=localhost
DB_NAME=medicalcare
DB_USER=root
DB_PASSWORD=tu_password_aqui

DB_PERSISTENT=true
DB_CHARSET=utf8
```

### Paso 3: Configurar variables de entorno en Apache (Opcional)

Si usas XAMPP/Apache, puedes configurar las variables en `.htaccess` o en el VirtualHost:

```apache
# En .htaccess o VirtualHost
SetEnv DB_HOST localhost
SetEnv DB_NAME medicalcare
SetEnv DB_USER root
SetEnv DB_PASSWORD tu_password
```

### Nota de Seguridad

⚠️ **IMPORTANTE**:
- El archivo `.env` ya está en `.gitignore` y NO debe subirse a Git
- Nunca compartas tus credenciales en repositorios públicos
- En producción, usa variables de entorno del servidor

## Retrocompatibilidad

Si no configuras el archivo `.env`, el sistema usará valores por defecto para desarrollo local:
- Host: localhost
- Usuario: root
- Password: (vacío)
- Base de datos: medicalcare

## Optimizaciones Implementadas

### Fase 1: Performance, Seguridad y Accesibilidad
✅ N+1 query fix en `get_examenes_eco.php` (26 queries → 1 query)
✅ Credenciales en variables de entorno
✅ Mejor manejo de errores de conexión (no expone detalles técnicos)
✅ TailwindCSS compilado (3MB → 14KB, reducción 99.5%)
✅ Sistema de caché en ApiService
✅ Accesibilidad WCAG 2.1 Level A

### Fase 2: UX Avanzada y Memory Management
✅ **Memoización de Levenshtein** - Búsquedas 40-60% más rápidas
✅ **Sistema de Toasts** - Notificaciones no bloqueantes
✅ **Loading States** - Feedback visual en todas las operaciones
✅ **Event Manager** - Prevención automática de memory leaks

## Nuevas Funcionalidades (Fase 2)

### Sistema de Notificaciones
```javascript
// Reemplaza alert() con toasts elegantes
ToastNotification.success("¡Operación exitosa!");
ToastNotification.error("Error al cargar datos");
ToastNotification.warning("Complete todos los campos");
ToastNotification.info("Procesando...");

// O usar helpers de Utils
Utils.mostrarError("Error al cargar");
Utils.mostrarExito("Cita agendada");
```

### Loading States
```javascript
// Loading automático en APIs (ya integrado)
await ApiService.obtenerEspecialidades(); // Muestra "Cargando especialidades..."

// Loading manual
const loaderId = LoadingState.show("Procesando...");
await miOperacion();
LoadingState.hide(loaderId);

// Wrapper para funciones async
await LoadingState.withLoading(
  async () => await miOperacion(),
  "Cargando datos..."
);
```

### Event Manager (Prevención de Memory Leaks)
```javascript
// Usar en lugar de addEventListener tradicional
addManagedListener(elemento, 'click', handleClick);
// ↑ Se limpia automáticamente cuando el elemento se remueve

// Event delegation para elementos dinámicos
EventManager.delegate(container, 'click', '.item', handleItemClick);

// Ver estadísticas de listeners
console.log(EventManager.getStats());
```

## Estructura de Archivos JavaScript

```
js/
├── config.js          # Configuración global
├── toast.js           # Sistema de notificaciones (Fase 2)
├── loading.js         # Estados de carga (Fase 2)
├── eventManager.js    # Gestión de eventos (Fase 2)
├── utils.js           # Utilidades + memoización
├── api.js             # Cliente HTTP con caché y timeout
├── search.js          # Motor de búsqueda optimizado
├── ui.js              # Componentes UI
└── app.js             # Controlador principal
```

## Testing en Consola del Navegador

```javascript
// Probar memoización
Utils._levenshteinCache.size; // Ver tamaño del caché
Utils.clearLevenshteinCache(); // Limpiar caché

// Probar toasts
ToastNotification.success("¡Funciona!");

// Probar loading
await LoadingState.withLoading(
  async () => await new Promise(r => setTimeout(r, 2000)),
  "Esperando 2 segundos..."
);

// Ver estadísticas de event listeners
EventManager.getStats();

// Detectar memory leaks
EventManager.detectPotentialLeaks(100);

// Ver estadísticas de caché de API
ApiService.getCacheStats();
```

