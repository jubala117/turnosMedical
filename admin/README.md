# Dashboard de Administración - Kiosco Medical Care

Dashboard visual para gestionar el kiosco sin necesidad de conocimientos técnicos.

## 🚀 Características

### ✅ FASE 1 - Funcionalidades Actuales

- **Gestión de Especialidades**
  - ✅ Ver todas las especialidades configuradas
  - ✅ Crear nuevas especialidades
  - ✅ Editar especialidades existentes
  - ✅ Activar/desactivar especialidades
  - ✅ Eliminar especialidades
  - ✅ Buscar y filtrar
  - ✅ Estadísticas en tiempo real

- **Configuración de Precios**
  - ✅ Precios por ID de Base de Datos
  - ✅ Precios fijos ($20, $25, etc.)
  - ✅ Precio particular y Club Medical

- **Tipos de Sección**
  - ✅ Consulta (con doctores)
  - ✅ Exámenes (lista simple)

- **Imágenes Personalizadas**
  - ✅ Upload de imágenes (JPG, PNG, GIF, WebP)
  - ✅ Preview en tiempo real
  - ✅ Validación de tamaño y tipo
  - ✅ Redimensionamiento automático
  - ✅ Visualización en tarjetas de especialidades

### 🔜 Próximamente (FASE 2)

- [ ] Opciones múltiples ("Una Hora", "Media Hora")
- [ ] Reordenar con drag & drop
- [ ] Gestión de categorías de exámenes

## 📦 Instalación

### 1. Ejecutar el Schema de Base de Datos

```bash
# Conectarse a MySQL
mysql -u tu_usuario -p tu_base_de_datos

# Ejecutar el schema
source database/kiosk_config_schema.sql
```

Este script creará automáticamente:
- Todas las tablas necesarias
- Datos iniciales (migración del PHP actual)
- Views y stored procedures

### 2. Verificar Permisos

Asegúrate de que el usuario de la BD tenga permisos de:
- SELECT, INSERT, UPDATE, DELETE en las tablas `kiosk_*`
- EXECUTE en stored procedures

### 3. Acceder al Dashboard

```
http://tu-servidor/admin/dashboard.html
```

## 📖 Uso del Dashboard

### Crear Nueva Especialidad

1. Click en "Nueva Especialidad"
2. Seleccionar la especialidad de la lista
3. Configurar:
   - Estado (Activo/Inactivo)
   - Tipo de sección
   - Precios (por ID o fijos)
4. Guardar

### Editar Especialidad

1. Click en "Editar" en la tarjeta de la especialidad
2. Modificar los campos necesarios
3. Guardar

### Subir Imagen Personalizada

1. Abrir modal de crear/editar especialidad
2. Click en "Subir Imagen" en la sección "Imagen Personalizada"
3. Seleccionar archivo (JPG, PNG, GIF o WebP, máximo 5MB)
4. Ver preview de la imagen
5. Guardar la especialidad
6. La imagen aparecerá en la tarjeta de la especialidad

**Nota**: Las imágenes se redimensionan automáticamente para optimizar el rendimiento.

### Activar/Desactivar

Click en "Activar" o "Desactivar" en la tarjeta

### Eliminar

Click en el ícono de basura (⚠️ acción irreversible)

## 🔍 Filtros y Búsqueda

- **Buscar**: Filtrar por nombre de especialidad
- **Estado**: Ver solo activas o inactivas
- **Tipo**: Filtrar por tipo de sección

## 🎨 Tipos de Precio

### Por ID de Base de Datos

Usa los IDs existentes en `tipoServicio` o `tipoExamenLab`:

```
ID Particular: 560
ID Club: 668
```

El sistema consultará automáticamente los precios de la BD.

### Precio Fijo

Define un precio directamente:

```
Precio Particular: $25.00
Precio Club: $20.00
```

## 📊 Estructura de Datos

### Tablas Principales

```
kiosk_especialidad_config
├─ Configuración principal
└─ Relación con tabla 'especialidad'

kiosk_precio_config
├─ Precios simples
└─ IDs de servicios o precios fijos

kiosk_precio_opciones
└─ Opciones múltiples (próximamente)
```

## 🔐 Seguridad

⚠️ **IMPORTANTE**: Este dashboard NO tiene autenticación.

### Para Producción:

1. Agregar login con usuario/contraseña
2. Implementar roles (admin, editor)
3. Mover `/admin` fuera del directorio público
4. Usar HTTPS
5. Agregar logs de auditoría

## 🐛 Troubleshooting

### Error: "Método no permitido"

- Verificar que el servidor permita métodos PUT y DELETE
- Configurar `.htaccess` o Nginx

### Error: "Tabla no existe"

- Ejecutar el schema SQL
- Verificar nombre de la base de datos

### No se cargan las especialidades

- Verificar que `../API/get_especialidades.php` funcione
- Revisar consola del navegador (F12)

## 📁 Estructura de Archivos

```
admin/
├── dashboard.html          # Interfaz principal
├── js/
│   └── dashboard.js        # Lógica del dashboard
├── api/
│   └── especialidades_config.php  # API REST
└── README.md              # Este archivo

database/
└── kiosk_config_schema.sql  # Schema de BD
```

## 🔄 Flujo de Datos

```
Dashboard (HTML/JS)
    ↓
API REST (especialidades_config.php)
    ↓
Base de Datos (kiosk_* tables)
    ↓
Kiosco (get_especialidades.php)
    ↓
Usuario Final
```

## 💡 Ejemplos de Uso

### Agregar Cardiología

1. Nueva Especialidad
2. Especialidad: "Cardiología"
3. Tipo: Consulta
4. ID Particular: 850
5. ID Club: 851
6. Guardar

### Cambiar Precio de Pediatría

1. Buscar "Pediatría"
2. Editar
3. Cambiar ID Particular: 1417 → 1420
4. Guardar

### Desactivar temporalmente Nutrición

1. Buscar "Nutrición"
2. Click "Desactivar"
3. (Para reactivar: Click "Activar")

## 📞 Soporte

Para dudas o problemas:
1. Revisar este README
2. Consultar la consola del navegador (F12)
3. Verificar logs del servidor

---

**Versión**: 1.0.0 (FASE 1)
**Última actualización**: Octubre 2025
