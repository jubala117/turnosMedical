// Módulo de búsqueda inteligente con algoritmos optimizados

class SearchEngine {
    // Verificar coincidencia fuzzy
    static esCoincidenciaFuzzy(terminoBusqueda, terminoExamen, umbral) {
        // Usar umbral por defecto si no se proporciona
        if (umbral === undefined) {
            umbral = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_THRESHOLD) ? CONFIG.SEARCH_THRESHOLD : 0.7;
        }
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

    // Calcular puntaje por coincidencia exacta
    static calcularPuntajeExacto(busquedaNormalizada, examenNormalizadoOriginal, examenNormalizadoVisible) {
        const scores = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_SCORES) ? CONFIG.SEARCH_SCORES : {
            EXACT_MATCH: 1000
        };
        
        if (examenNormalizadoOriginal === busquedaNormalizada || examenNormalizadoVisible === busquedaNormalizada) {
            return scores.EXACT_MATCH || 1000;
        }
        return 0;
    }

    // Calcular puntaje por substring
    static calcularPuntajeSubstring(busquedaNormalizada, examenNormalizadoOriginal, examenNormalizadoVisible) {
        const scores = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_SCORES) ? CONFIG.SEARCH_SCORES : {
            SUBSTRING_ORIGINAL: 800,
            SUBSTRING_VISIBLE: 750,
            INVERSE_MATCH: 700
        };
        
        if (examenNormalizadoOriginal.includes(busquedaNormalizada)) {
            return scores.SUBSTRING_ORIGINAL || 800;
        } else if (examenNormalizadoVisible.includes(busquedaNormalizada)) {
            return scores.SUBSTRING_VISIBLE || 750;
        } else if (busquedaNormalizada.includes(examenNormalizadoOriginal) || busquedaNormalizada.includes(examenNormalizadoVisible)) {
            return scores.INVERSE_MATCH || 700;
        }
        return 0;
    }

    // Calcular puntaje por componentes
    static calcularPuntajeComponentes(componentesBusqueda, componentesExamenOriginal, componentesExamenVisible) {
        const scores = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_SCORES) ? CONFIG.SEARCH_SCORES : {
            COMPONENT_MATCH: 100,
            ALL_COMPONENTS_BONUS: 200
        };
        
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
            let puntaje = componentesCoincidentes * (scores.COMPONENT_MATCH || 100);
            
            // Bonus si coinciden todos los componentes
            if (componentesCoincidentes === componentesBusqueda.length) {
                puntaje += scores.ALL_COMPONENTS_BONUS || 200;
            }
            
            return puntaje;
        }
        return 0;
    }

    // Calcular puntaje por sinónimos
    static calcularPuntajeSinonimos(busqueda, examenNormalizadoOriginal, examenNormalizadoVisible) {
        const scores = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_SCORES) ? CONFIG.SEARCH_SCORES : {
            SYNONYM_MATCH: 150
        };
        
        const terminosExpandidos = SearchEngine.expandirTerminosBusqueda(busqueda);
        for (const terminoExpandido of terminosExpandidos) {
            if (examenNormalizadoOriginal.includes(terminoExpandido)) {
                return scores.SYNONYM_MATCH || 150;
            } else if (examenNormalizadoVisible.includes(terminoExpandido)) {
                return (scores.SYNONYM_MATCH || 150) - 10; // Ligeramente menos
            }
        }
        return 0;
    }

    // Calcular puntaje por similitud fonética (fuzzy)
    static calcularPuntajeFuzzy(busquedaNormalizada, examenNormalizadoOriginal, examenNormalizadoVisible) {
        const scores = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_SCORES) ? CONFIG.SEARCH_SCORES : {
            FUZZY_MATCH_ORIGINAL: 120,
            FUZZY_MATCH_VISIBLE: 110
        };
        
        if (SearchEngine.esCoincidenciaFuzzy(busquedaNormalizada, examenNormalizadoOriginal, 0.7)) {
            return scores.FUZZY_MATCH_ORIGINAL || 120;
        } else if (SearchEngine.esCoincidenciaFuzzy(busquedaNormalizada, examenNormalizadoVisible, 0.7)) {
            return scores.FUZZY_MATCH_VISIBLE || 110;
        }
        return 0;
    }

    // Calcular puntaje de búsqueda (refactorizado)
    static calcularPuntajeBusqueda(busqueda, examen) {
        const busquedaNormalizada = Utils.normalizarTexto(busqueda);
        
        // Extraer descripciones
        const descripcionOriginal = examen.descripcion || '';
        const descripcionVisible = examen.descripcion_visible || '';
        const examenNormalizadoOriginal = Utils.normalizarTexto(descripcionOriginal);
        const examenNormalizadoVisible = Utils.normalizarTexto(descripcionVisible);
        
        // Extraer componentes
        const componentesBusqueda = Utils.extraerComponentes(busqueda);
        const componentesExamenOriginal = Utils.extraerComponentes(descripcionOriginal);
        const componentesExamenVisible = Utils.extraerComponentes(descripcionVisible);

        // Calcular puntajes por tipo de coincidencia
        let puntaje = 0;
        puntaje += SearchEngine.calcularPuntajeExacto(busquedaNormalizada, examenNormalizadoOriginal, examenNormalizadoVisible);
        puntaje += SearchEngine.calcularPuntajeSubstring(busquedaNormalizada, examenNormalizadoOriginal, examenNormalizadoVisible);
        puntaje += SearchEngine.calcularPuntajeComponentes(componentesBusqueda, componentesExamenOriginal, componentesExamenVisible);
        puntaje += SearchEngine.calcularPuntajeSinonimos(busqueda, examenNormalizadoOriginal, examenNormalizadoVisible);
        puntaje += SearchEngine.calcularPuntajeFuzzy(busquedaNormalizada, examenNormalizadoOriginal, examenNormalizadoVisible);

        return puntaje;
    }

    // Búsqueda principal
    static buscarExamenes(terminoBusqueda, examenes) {
        const minLength = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_MIN_LENGTH) ? CONFIG.SEARCH_MIN_LENGTH : 2;
        if (!terminoBusqueda || terminoBusqueda.trim().length < minLength) {
            return examenes; // Devolver todos si la búsqueda es muy corta
        }

        const area = UIManager.estado.areaActual || 'laboratorio';
        
        // Usar Logger si está disponible, sino usar console.log
        if (typeof Logger !== 'undefined') {
            Logger.search('ÁREA DETECTADA:', { area, estado: UIManager.estado });
        } else {
            console.log('🔍 ÁREA DETECTADA:', area, 'UIManager.estado:', UIManager.estado);
        }
        
        // Búsqueda especializada para odontología
        if (area === 'odontologia') {
            return SearchEngine.buscarServiciosOdontologia(terminoBusqueda, examenes);
        }

        const resultadosConPuntaje = examenes.map(examen => ({
            examen,
            puntaje: SearchEngine.calcularPuntajeBusqueda(terminoBusqueda, examen)
        }));

        // Obtener umbral desde configuración (con fallback si CONFIG no está disponible)
        const umbral = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_THRESHOLDS) 
            ? (CONFIG.SEARCH_THRESHOLDS[area] || CONFIG.SEARCH_THRESHOLDS.laboratorio)
            : (area === 'ecografia' ? 750 : 50);
        
        if (typeof Logger !== 'undefined') {
            Logger.search('Filtrado por área:', {
                area,
                umbral,
                resultadosAntesFiltro: resultadosConPuntaje.length
            });
        } else {
            console.log('🎯 Filtrado por área:', { area, umbral, resultadosAntesFiltro: resultadosConPuntaje.length });
        }

        const resultadosFiltrados = resultadosConPuntaje
            .filter(resultado => resultado.puntaje > umbral)
            .sort((a, b) => b.puntaje - a.puntaje)
            .map(resultado => resultado.examen);

        if (typeof Logger !== 'undefined') {
            Logger.search('Resultados después de filtro:', {
                umbral,
                resultadosFiltrados: resultadosFiltrados.length
            });
        } else {
            console.log('🎯 Resultados después de filtro:', { umbral, resultadosFiltrados: resultadosFiltrados.length });
        }

        // Log detallado de puntajes para debugging
        const logSearchDetails = (typeof CONFIG !== 'undefined' && CONFIG.LOG_SEARCH_DETAILS) ? CONFIG.LOG_SEARCH_DETAILS : true;
        if (logSearchDetails && area === 'ecografia' && terminoBusqueda) {
            if (typeof Logger !== 'undefined') {
                Logger.data('PUNTAJES DETALLADOS (Ecografía):');
            } else {
                console.log('📊 PUNTAJES DETALLADOS (Ecografía):');
            }
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
    static crearBuscadorDebounced(callback, wait) {
        // Usar wait por defecto si no se proporciona
        if (wait === undefined) {
            wait = (typeof CONFIG !== 'undefined' && CONFIG.SEARCH_DEBOUNCE_MS) ? CONFIG.SEARCH_DEBOUNCE_MS : 300;
        }
        return Utils.debounce((termino, datos) => {
            if (typeof Logger !== 'undefined') {
                Logger.search('Buscador debounced ejecutado:', {
                    termino,
                    datosRecibidos: datos.length,
                    datosAreaActual: window.datosAreaActual?.length || 0
                });
            } else {
                console.log('🔍 Buscador debounced ejecutado:', { termino, datosRecibidos: datos.length, datosAreaActual: window.datosAreaActual?.length || 0 });
            }
            
            const resultados = SearchEngine.buscarExamenes(termino, datos);
            
            if (typeof Logger !== 'undefined') {
                Logger.data('Resultados de búsqueda:', {
                    termino,
                    resultadosFiltrados: resultados.length,
                    datosOriginales: datos.length
                });
            } else {
                console.log('📊 Resultados de búsqueda:', { termino, resultadosFiltrados: resultados.length, datosOriginales: datos.length });
            }
            
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

    // Clasificar procedimientos de Rayos X por categorías
    static clasificarProcedimientosRayosX(procedimientos) {
        const categorias = {
            'CRÁNEO': [],
            'EXTREMIDADES SUPERIORES': [],
            'EXTREMIDADES INFERIORES': [],
            'TÓRAX': [],
            'ABDOMEN': [],
            'PELVIS': [],
            'COLUMNA VERTEBRAL': [],
            'ESTUDIOS CONTRASTADOS': []
        };

        procedimientos.forEach(procedimiento => {
            const descripcion = procedimiento.descripcion.toUpperCase();
            
            if (descripcion.includes('CRANEO') || descripcion.includes('WATERS') || descripcion.includes('SENOS') || 
                descripcion.includes('ORBITAS') || descripcion.includes('TEMPOROMANDIBULAR') || descripcion.includes('MAXILAR') ||
                descripcion.includes('NARIZ') || descripcion.includes('CAVUN')) {
                categorias['CRÁNEO'].push(procedimiento);
            } else if (descripcion.includes('HOMBRO') || descripcion.includes('BRAZO') || descripcion.includes('HUMERO') ||
                       descripcion.includes('CODO') || descripcion.includes('ANTEBRAZO') || descripcion.includes('MUÑECA') ||
                       descripcion.includes('MANO') || descripcion.includes('DEDOS')) {
                categorias['EXTREMIDADES SUPERIORES'].push(procedimiento);
            } else if (descripcion.includes('FEMUR') || descripcion.includes('MUSLO') || descripcion.includes('RODILLA') ||
                       descripcion.includes('PIERNA') || descripcion.includes('TOBILLO') || descripcion.includes('PIE') ||
                       descripcion.includes('CALCANEOS')) {
                categorias['EXTREMIDADES INFERIORES'].push(procedimiento);
            } else if (descripcion.includes('TORAX') || descripcion.includes('TELERADIOGRAFIA')) {
                categorias['TÓRAX'].push(procedimiento);
            } else if (descripcion.includes('ABDOMEN')) {
                categorias['ABDOMEN'].push(procedimiento);
            } else if (descripcion.includes('PELVIS') || descripcion.includes('CADERA')) {
                categorias['PELVIS'].push(procedimiento);
            } else if (descripcion.includes('CERVICAL') || descripcion.includes('DORSAL') || descripcion.includes('LUMBAR') ||
                       descripcion.includes('COLUMNA') || descripcion.includes('SACRO') || descripcion.includes('COXIS')) {
                categorias['COLUMNA VERTEBRAL'].push(procedimiento);
            } else if (descripcion.includes('COLON') || descripcion.includes('TRANSITO') || descripcion.includes('ESOFAGOGRAMA')) {
                categorias['ESTUDIOS CONTRASTADOS'].push(procedimiento);
            } else {
                // Si no coincide con ninguna categoría, poner en la primera disponible
                categorias['CRÁNEO'].push(procedimiento);
            }
        });

        return categorias;
    }

    // Clasificar exámenes de ecografía por categorías
    static clasificarExamenesEcografia(examenes) {
        const categorias = {
            'ECOGRAFÍAS ABDOMINALES': [],
            'ECOGRAFÍAS PÉLVICAS': [],
            'ECOGRAFÍAS OBSTÉTRICAS': [],
            'ECOGRAFÍAS DE PARTES BLANDAS': [],
            'ECOGRAFÍAS VASCULARES': [],
            'ECOGRAFÍAS PEDIÁTRICAS': []
        };

        examenes.forEach(examen => {
            const descripcion = examen.descripcion.toUpperCase();
            
            if (descripcion.includes('ABDOMEN') || descripcion.includes('HIGADO') || descripcion.includes('RENAL') || 
                descripcion.includes('PROSTATICO') || descripcion.includes('VESICAL')) {
                categorias['ECOGRAFÍAS ABDOMINALES'].push(examen);
            } else if (descripcion.includes('PELVICO') || descripcion.includes('TRANSVAGINAL') || descripcion.includes('MAMARIO')) {
                categorias['ECOGRAFÍAS PÉLVICAS'].push(examen);
            } else if (descripcion.includes('OBSTETRICO') || descripcion.includes('FETAL') || descripcion.includes('PERFIL BIOFISICO')) {
                categorias['ECOGRAFÍAS OBSTÉTRICAS'].push(examen);
            } else if (descripcion.includes('TIROIDES') || descripcion.includes('CUELLO') || descripcion.includes('PARED ABDOMINAL') ||
                       descripcion.includes('TESTICULAR') || descripcion.includes('MUSCULO ESQUELETICO')) {
                categorias['ECOGRAFÍAS DE PARTES BLANDAS'].push(examen);
            } else if (descripcion.includes('DOPPLER')) {
                categorias['ECOGRAFÍAS VASCULARES'].push(examen);
            } else if (descripcion.includes('TRANSFONTANELAR') || descripcion.includes('CADERA PEDIATRICA')) {
                categorias['ECOGRAFÍAS PEDIÁTRICAS'].push(examen);
            } else {
                // Si no coincide con ninguna categoría, poner en abdominales por defecto
                categorias['ECOGRAFÍAS ABDOMINALES'].push(examen);
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
                    // Ejecutar búsqueda con 2+ caracteres (para VIH, TSH, T3, T4, LH, etc.)
                    buscadorDebounced(termino, datosAreaActual);
                } else if (termino.length === 0) {
                    // Campo vacío: restaurar vista completa con categorías
                    console.log('🔄 Campo vacío detectado, restaurando vista completa');
                    callbackRenderizado(datosAreaActual, '');
                } else if (termino.length === 1) {
                    // Solo 1 carácter: restaurar vista completa inmediatamente
                    console.log('🔄 Solo 1 carácter detectado, restaurando vista completa');
                    callbackRenderizado(datosAreaActual, '');
                }
            }
        });

        // Evento adicional para detectar borrado rápido
        buscarInput.addEventListener('keydown', function(event) {
            if (event.key === 'Backspace' || event.key === 'Delete') {
                const termino = this.value.trim();
                // Si queda 1 carácter y se presiona borrar, restaurar vista completa inmediatamente
                if (termino.length === 1) {
                    setTimeout(() => {
                        const nuevoTermino = this.value.trim();
                        if (nuevoTermino.length === 0) {
                            const datosAreaActual = window.datosAreaActual || [];
                            if (datosAreaActual && datosAreaActual.length > 0) {
                                console.log('🔄 Borrado completo detectado, restaurando vista completa');
                                callbackRenderizado(datosAreaActual, '');
                            }
                        }
                    }, 10);
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
