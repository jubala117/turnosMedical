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

## Optimizaciones Implementadas (Fase 1)

✅ N+1 query fix en `get_examenes_eco.php` (26 queries → 1 query)
✅ Credenciales en variables de entorno
✅ Mejor manejo de errores de conexión (no expone detalles técnicos)
