// Módulo de búsqueda inteligente con algoritmos optimizados

class SearchEngine {
    // Verificar coincidencia fuzzy
    static esCoincidenciaFuzzy(terminoBusqueda, terminoExamen, umbral = CONFIG.SEARCH_THRESHOLD) {
        const distancia = Utils.calcularDistanciaLevenshtein(terminoBusqueda, terminoExamen);
        const longitudMaxima = Math.max(terminoBusqueda.length, terminoExamen.length);
        const similitud = 1 - (distancia / longitudMaxima);
        return similitud >= umbral;
    }

    // Expandir términos de búsqueda usando sinónimos
    static expandirTerminosBusqueda(termino) {
        const terminosExpandidos = new Set([termino]);
        const terminoNormalizado = Utils.normalizarTexto(termino);

        // Expansión por sinónimos directos
        Object.keys(SINONIMOS_MEDICOS).forEach(sinonimo => {
            const sinonimoNormalizado = Utils.normalizarTexto(sinonimo);
            
            // Si el término de búsqueda contiene el sinónimo
            if (terminoNormalizado.includes(sinonimoNormalizado)) {
                SINONIMOS_MEDICOS[sinonimo].forEach(variante => {
                    const nuevaBusqueda = terminoNormalizado.replace(sinonimoNormalizado, Utils.normalizarTexto(variante));
                    terminosExpandidos.add(nuevaBusqueda);
                });
            }
            
            // También agregar el sinónimo principal si hay coincidencia parcial
            if (SearchEngine.esCoincidenciaFuzzy(terminoNormalizado, sinonimoNormalizado, 0.6)) {
                terminosExpandidos.add(sinonimoNormalizado);
                SINONIMOS_MEDICOS[sinonimo].forEach(variante => {
                    terminosExpandidos.add(Utils.normalizarTexto(variante));
                });
            }
        });

        return Array.from(terminosExpandidos);
    }

    // Calcular puntaje de búsqueda
    static calcularPuntajeBusqueda(busqueda, examen) {
        let puntaje = 0;
        const busquedaNormalizada = Utils.normalizarTexto(busqueda);
        
        // Buscar tanto en descripcion original como en descripcion_visible
        const descripcionOriginal = examen.descripcion || '';
        const descripcionVisible = examen.descripcion_visible || '';
        
        const examenNormalizadoOriginal = Utils.normalizarTexto(descripcionOriginal);
        const examenNormalizadoVisible = Utils.normalizarTexto(descripcionVisible);
        
        const componentesBusqueda = Utils.extraerComponentes(busqueda);
        const componentesExamenOriginal = Utils.extraerComponentes(descripcionOriginal);
        const componentesExamenVisible = Utils.extraerComponentes(descripcionVisible);

        // 1. Coincidencia exacta (máxima prioridad)
        if (examenNormalizadoOriginal === busquedaNormalizada || examenNormalizadoVisible === busquedaNormalizada) {
            puntaje += 1000;
        }

        // 2. Coincidencia parcial (substring) - en ambos campos
        if (examenNormalizadoOriginal.includes(busquedaNormalizada)) {
            puntaje += 800;
        } else if (examenNormalizadoVisible.includes(busquedaNormalizada)) {
            puntaje += 750; // Ligeramente menos que en el original
        } else if (busquedaNormalizada.includes(examenNormalizadoOriginal) || busquedaNormalizada.includes(examenNormalizadoVisible)) {
            puntaje += 700;
        }

        // 3. Coincidencia por componentes - en ambos campos
        const componentesCoincidentesOriginal = componentesBusqueda.filter(compBusqueda =>
            componentesExamenOriginal.some(compExamen => 
                compExamen.includes(compBusqueda) || compBusqueda.includes(compExamen) ||
                SearchEngine.esCoincidenciaFuzzy(compBusqueda, compExamen, 0.8)
            )
        ).length;

        const componentesCoincidentesVisible = componentesBusqueda.filter(compBusqueda =>
            componentesExamenVisible.some(compExamen => 
                compExamen.includes(compBusqueda) || compBusqueda.includes(compExamen) ||
                SearchEngine.esCoincidenciaFuzzy(compBusqueda, compExamen, 0.8)
            )
        ).length;

        const componentesCoincidentes = Math.max(componentesCoincidentesOriginal, componentesCoincidentesVisible);

        if (componentesCoincidentes > 0) {
            puntaje += componentesCoincidentes * 100;
            
            // Bonus si coinciden todos los componentes principales
            if (componentesCoincidentes === componentesBusqueda.length) {
                puntaje += 200;
            }
        }

        // 4. Coincidencia por sinónimos expandidos - en ambos campos
        const terminosExpandidos = SearchEngine.expandirTerminosBusqueda(busqueda);
        for (const terminoExpandido of terminosExpandidos) {
            if (examenNormalizadoOriginal.includes(terminoExpandido)) {
                puntaje += 150;
                break;
            } else if (examenNormalizadoVisible.includes(terminoExpandido)) {
                puntaje += 140; // Ligeramente menos que en el original
                break;
            }
        }

        // 5. Coincidencia fonética (Levenshtein) - en ambos campos
        if (SearchEngine.esCoincidenciaFuzzy(busquedaNormalizada, examenNormalizadoOriginal, 0.7)) {
            puntaje += 120;
        } else if (SearchEngine.esCoincidenciaFuzzy(busquedaNormalizada, examenNormalizadoVisible, 0.7)) {
            puntaje += 110; // Ligeramente menos que en el original
        }

        return puntaje;
    }

    // Búsqueda principal
    static buscarExamenes(terminoBusqueda, examenes) {
        if (!terminoBusqueda || terminoBusqueda.trim().length < 2) {
            return examenes; // Devolver todos si la búsqueda es muy corta
        }

        const area = UIManager.estado.areaActual || 'laboratorio';
        console.log('🔍 ÁREA DETECTADA:', area, 'UIManager.estado:', UIManager.estado);
        
        // Búsqueda especializada para odontología
        if (area === 'odontologia') {
            return SearchEngine.buscarServiciosOdontologia(terminoBusqueda, examenes);
        }

        const resultadosConPuntaje = examenes.map(examen => ({
            examen,
            puntaje: SearchEngine.calcularPuntajeBusqueda(terminoBusqueda, examen)
        }));

        // Filtrar resultados con puntaje significativo y ordenar
        // Umbral más alto para Ecografía (nombres más largos y específicos)
        // Umbral de 750 para mostrar solo coincidencias directas (substring match = 800pts)
        const umbral = area === 'ecografia' ? 750 : 50;
        
        console.log('🎯 Filtrado por área:', {
            area: area,
            umbral: umbral,
            resultadosAntesFiltro: resultadosConPuntaje.length
        });

        const resultadosFiltrados = resultadosConPuntaje
            .filter(resultado => resultado.puntaje > umbral)
            .sort((a, b) => b.puntaje - a.puntaje)
            .map(resultado => resultado.examen);

        console.log('🎯 Resultados después de filtro:', {
            umbral: umbral,
            resultadosFiltrados: resultadosFiltrados.length
        });

        // Log detallado de puntajes para debugging
        if (area === 'ecografia' && terminoBusqueda) {
            console.log('📊 PUNTAJES DETALLADOS (Ecografía):');
            resultadosConPuntaje
                .sort((a, b) => b.puntaje - a.puntaje)
                .slice(0, 10) // Mostrar top 10
                .forEach((resultado, index) => {
                    console.log(`${index + 1}. [${resultado.puntaje}pts] ${resultado.examen.descripcion}`);
                });
            console.log(`Total exámenes evaluados: ${resultadosConPuntaje.length}`);
            console.log(`Exámenes que pasan el umbral (>${umbral}): ${resultadosFiltrados.length}`);
        }

        return resultadosFiltrados;
    }

    // Búsqueda especializada para servicios odontológicos
    static buscarServiciosOdontologia(terminoBusqueda, servicios) {
        const terminoNormalizado = Utils.normalizarTexto(terminoBusqueda);
        const resultados = [];

        servicios.forEach(servicio => {
            let puntajeServicio = 0;
            
            // Buscar en el nombre del servicio principal
            const nombreServicio = Utils.normalizarTexto(servicio.servicio);
            if (nombreServicio.includes(terminoNormalizado)) {
                puntajeServicio += 1000;
            } else if (SearchEngine.esCoincidenciaFuzzy(terminoNormalizado, nombreServicio, 0.7)) {
                puntajeServicio += 800;
            }

            // Buscar en las opciones del servicio
            if (servicio.encontrado && servicio.opciones) {
                servicio.opciones.forEach(opcion => {
                    const descripcionOpcion = Utils.normalizarTexto(opcion.descripcion_bd);
                    if (descripcionOpcion.includes(terminoNormalizado)) {
                        puntajeServicio += 900;
                    } else if (SearchEngine.esCoincidenciaFuzzy(terminoNormalizado, descripcionOpcion, 0.7)) {
                        puntajeServicio += 700;
                    }
                });
            }

            // Si hay puntaje significativo, incluir el servicio
            if (puntajeServicio > 0) {
                resultados.push({
                    servicio: servicio,
                    puntaje: puntajeServicio
                });
            }
        });

        // Ordenar por puntaje y devolver solo los servicios
        return resultados
            .sort((a, b) => b.puntaje - a.puntaje)
            .map(resultado => resultado.servicio);
    }

    // Búsqueda con debouncing
    static crearBuscadorDebounced(callback, wait = 300) {
        return Utils.debounce((termino, datos) => {
            console.log('🔍 Buscador debounced ejecutado:', {
                termino: termino,
                datosRecibidos: datos.length,
                datosAreaActual: window.datosAreaActual?.length || 0
            });
            const resultados = SearchEngine.buscarExamenes(termino, datos);
            console.log('📊 Resultados de búsqueda:', {
                termino: termino,
                resultadosFiltrados: resultados.length,
                datosOriginales: datos.length
            });
            callback(resultados, termino);
        }, wait);
    }

    // Clasificar exámenes por categorías
    static clasificarExamenesPorCategoria(examenes, area = 'laboratorio') {
        if (area !== 'laboratorio') {
            return { 'TODOS': examenes }; // Para otras áreas, no categorizar
        }

        const categorias = {
            'ORINA': [],
            'HECES': [],
            'HEMATOLOGÍA': [],
            'BIOQUÍMICA': [],
            'INMUNOLOGÍA': [],
            'HORMONAS': [],
            'OTROS': []
        };

        // Clasificar exámenes por categorías
        examenes.forEach(examen => {
            const descripcion = examen.descripcion.toUpperCase();
            
            if (descripcion.includes('ORINA')) {
                categorias['ORINA'].push(examen);
            } else if (descripcion.includes('HECES') || descripcion.includes('COPRO')) {
                categorias['HECES'].push(examen);
            } else if (descripcion.includes('HEMO') || descripcion.includes('SANGRE') || descripcion.includes('PLAQUETA')) {
                categorias['HEMATOLOGÍA'].push(examen);
            } else if (descripcion.includes('GLUCOSA') || descripcion.includes('COLESTEROL') || descripcion.includes('TRIGLICERIDOS') || 
                       descripcion.includes('BILIRRUBINA') || descripcion.includes('CREATININA') || descripcion.includes('UREA')) {
                categorias['BIOQUÍMICA'].push(examen);
            } else if (descripcion.includes('IGG') || descripcion.includes('IGM') || descripcion.includes('ANTI') || 
                       descripcion.includes('HEPATITIS') || descripcion.includes('HIV') || descripcion.includes('COVID')) {
                categorias['INMUNOLOGÍA'].push(examen);
            } else if (descripcion.includes('HORMONA') || descripcion.includes('TSH') || descripcion.includes('T3') || 
                       descripcion.includes('T4') || descripcion.includes('ESTROGENO') || descripcion.includes('TESTOSTERONA')) {
                categorias['HORMONAS'].push(examen);
            } else {
                categorias['OTROS'].push(examen);
            }
        });

        return categorias;
    }

    // Clasificar servicios odontológicos
    static clasificarServiciosOdontologia(servicios) {
        const categorias = {
            'CONSULTAS Y PREVENCIÓN': [],
            'RESTAURACIONES': [],
            'ENDODONCIA': [],
            'EXTRACCIONES': [],
            'ORTODONCIA': [],
            'OTROS SERVICIOS': []
        };

        servicios.forEach(servicio => {
            const nombre = servicio.servicio.toUpperCase();
            
            if (nombre.includes('CONSULTA') || nombre.includes('LIMPIEZA') || nombre.includes('FLUOR') || nombre.includes('SELLANTE')) {
                categorias['CONSULTAS Y PREVENCIÓN'].push(servicio);
            } else if (nombre.includes('RESTAURACIÓN') || nombre.includes('CARILLA') || nombre.includes('BLANQUEAMIENTO')) {
                categorias['RESTAURACIONES'].push(servicio);
            } else if (nombre.includes('ENDODONCIA') || nombre.includes('PULPECTOMIA')) {
                categorias['ENDODONCIA'].push(servicio);
            } else if (nombre.includes('EXTRACCIÓN') || nombre.includes('MOLAR') || nombre.includes('ALARGAMIENTO')) {
                categorias['EXTRACCIONES'].push(servicio);
            } else if (nombre.includes('CONTROL') || nombre.includes('ORTODONCIA')) {
                categorias['ORTODONCIA'].push(servicio);
            } else {
                categorias['OTROS SERVICIOS'].push(servicio);
            }
        });

        return categorias;
    }

    // Inicializar eventos de búsqueda
    static inicializarBusqueda(callbackRenderizado) {
        const buscarInput = document.getElementById('buscar-examen');
        const limpiarBtn = document.getElementById('limpiar-busqueda');
        
        if (!buscarInput) return;

        // Crear buscador con debouncing
        const buscadorDebounced = SearchEngine.crearBuscadorDebounced(callbackRenderizado);

        // Evento de búsqueda en tiempo real
        buscarInput.addEventListener('input', function() {
            const termino = this.value.trim();
            const datosAreaActual = window.datosAreaActual || [];
            
            if (datosAreaActual && datosAreaActual.length > 0) {
                if (termino.length >= 2) {
                    buscadorDebounced(termino, datosAreaActual);
                } else if (termino.length === 0) {
                    callbackRenderizado(datosAreaActual, '');
                }
            }
        });

        // Evento para limpiar búsqueda
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', function() {
                buscarInput.value = '';
                buscarInput.focus();
                const datosAreaActual = window.datosAreaActual || [];
                if (datosAreaActual) {
                    callbackRenderizado(datosAreaActual, '');
                }
            });
        }

        // Evento Enter para buscar
        buscarInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                const termino = this.value.trim();
                const datosAreaActual = window.datosAreaActual || [];
                if (termino.length >= 2 && datosAreaActual) {
                    const resultados = SearchEngine.buscarExamenes(termino, datosAreaActual);
                    callbackRenderizado(resultados, termino);
                }
            }
        });
    }
}

// Exportar para uso global
window.SearchEngine = SearchEngine;
