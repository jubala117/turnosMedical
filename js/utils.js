// Módulo de utilidades y funciones auxiliares

class Utils {
    // Función para formatear fecha en letras
    static fechaLetras(dateString) {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const fecha = new Date(dateString + 'T00:00:00');
        return `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]} del ${fecha.getFullYear()}`;
    }

    // Generar nombre de imagen normalizado
    static generarNombreImagen(descEspecialidad) {
        const sinAcentos = descEspecialidad.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return sinAcentos
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    // Normalizar texto para búsqueda
    static normalizarTexto(texto) {
        return texto
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Extraer componentes de texto
    static extraerComponentes(texto) {
        return Utils.normalizarTexto(texto)
            .split(/\s+/)
            .filter(token => token.length > 2);
    }

    // Calcular distancia de Levenshtein
    static calcularDistanciaLevenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i-1) === a.charAt(j-1)) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i-1][j-1] + 1,
                        matrix[i][j-1] + 1,
                        matrix[i-1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    // Verificar si es especialidad con opciones múltiples
    static esEspecialidadConOpcionesMultiples(descEspecialidad) {
        const descNormalizada = descEspecialidad.toUpperCase();
        return CONFIG.ESPECIALIDADES_CON_OPCIONES.some(esp => descNormalizada.includes(esp));
    }

    // Función debounce para búsqueda en tiempo real
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Mostrar mensaje de error
    static mostrarError(mensaje) {
        console.error('Error:', mensaje);
        console.trace('Stack trace del error:'); // Para identificar qué función está llamando a mostrarError
        alert(mensaje);
    }

    // Mostrar mensaje de éxito
    static mostrarExito(mensaje) {
        console.log('Éxito:', mensaje);
        alert(mensaje);
    }

    // Validar cédula
    static validarCedula(cedula) {
        return cedula && cedula.length >= 10;
    }

    // Formatear precio
    static formatearPrecio(precio) {
        return parseFloat(precio).toFixed(2);
    }

    // Crear elemento HTML
    static crearElemento(tag, clases = '', contenido = '') {
        const elemento = document.createElement(tag);
        if (clases) elemento.className = clases;
        if (contenido) elemento.innerHTML = contenido;
        return elemento;
    }

    // Limpiar contenedor
    static limpiarContenedor(contenedor) {
        if (contenedor) {
            contenedor.innerHTML = '';
        }
    }

    // Mostrar pantalla
    static mostrarPantalla(screenId) {
        // Limpiar búsqueda si estamos saliendo de pantalla de exámenes
        const pantallaActual = document.querySelector('.screen.active');
        if (pantallaActual && pantallaActual.id === 'screen-examenes' && screenId !== 'screen-examenes') {
            Utils.limpiarBusquedaCompleta();
        }
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            activeScreen.classList.add('active');
            
            // 🔥 NUEVO: Scroll automático al top cuando se cambia de pantalla
            window.scrollTo(0, 0);
        }
    }

    // Detectar área actual para búsqueda
    static detectarAreaActual() {
        const titulo = document.getElementById('titulo-examenes')?.textContent || '';
        const subtitulo = document.getElementById('subtitulo-examenes')?.textContent || '';
        
        if (titulo.includes('Laboratorio')) {
            return 'laboratorio';
        } else if (titulo.includes('Imagenología') || titulo.includes('Ecografía')) {
            return 'ecografia';
        } else if (titulo.includes('Odontológicos')) {
            return 'odontologia';
        }
        return 'laboratorio';
    }

    // Actualizar placeholder según área
    static actualizarPlaceholder() {
        const buscarInput = document.getElementById('buscar-examen');
        if (!buscarInput) return;
        
        const areaActual = Utils.detectarAreaActual();
        const placeholders = {
            'laboratorio': '🔍 Buscar examen... Ej: glucosa, c p k, tiroides',
            'ecografia': '🔍 Buscar examen... Ej: abdomen, tiroides, mama',
            'odontologia': '🔍 Buscar servicio... Ej: limpieza, extracción, endodoncia'
        };
        
        buscarInput.placeholder = placeholders[areaActual] || placeholders['laboratorio'];
    }

    // Resetear búsqueda
    static resetearBusqueda() {
        const buscarInput = document.getElementById('buscar-examen');
        const limpiarBusqueda = document.getElementById('limpiar-busqueda');
        const contadorResultados = document.getElementById('contador-resultados');
        
        if (buscarInput) {
            buscarInput.value = '';
        }
        if (limpiarBusqueda) {
            limpiarBusqueda.classList.add('hidden');
        }
        if (contadorResultados) {
            contadorResultados.textContent = '';
        }
    }

    // Limpiar búsqueda completamente (incluye renderizado)
    static limpiarBusquedaCompleta() {
        Utils.resetearBusqueda();
        
        // Si estamos en pantalla de exámenes, renderizar todos los datos
        if (document.getElementById('screen-examenes')?.classList.contains('active')) {
            const datosAreaActual = window.datosAreaActual || [];
            if (datosAreaActual.length > 0) {
                AppController.renderizarExamenes(datosAreaActual);
            }
        }
    }
}

// Exportar para uso global
window.Utils = Utils;
