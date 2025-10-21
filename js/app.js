// Controlador principal de la aplicación

class AppController {
    // Inicializar aplicación
    static async inicializar() {
        // Inicializar referencias DOM
        UIManager.inicializarReferencias();
        
        // Configurar eventos
        AppController.configurarEventos();
        
        // Mostrar pantalla inicial
        Utils.mostrarPantalla('screen-cedula');
        
        console.log('Aplicación inicializada correctamente');
    }

    // Configurar eventos globales
    static configurarEventos() {
        // Evento para verificar cédula
        UIManager.elementos.verificarBtn.addEventListener('click', AppController.verificarCedula);
        
        // Evento Enter en input de cédula
        UIManager.elementos.cedulaInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                AppController.verificarCedula();
            }
        });

        // Eventos de navegación globales
        AppController.configurarEventosNavegacion();
    }

    // Configurar eventos de navegación
    static configurarEventosNavegacion() {
        // Los eventos onclick en los botones de navegación ya están configurados en el HTML
        // Aquí se pueden agregar eventos adicionales si es necesario
    }

    // Verificar cédula del paciente
    static async verificarCedula() {
        const cedula = UIManager.elementos.cedulaInput.value;
        
        // Validar cédula usando DataValidator
        const validation = DataValidator.validarCedula(cedula);
        if (!validation.valid) {
            Utils.mostrarError(validation.message);
            return;
        }

        try {
            const data = await ApiService.verificarPaciente(validation.value);

            // Validar respuesta de API
            DataValidator.validateApiResponse(data, ['existe']);

            if (data.existe) {
                // Validar campos requeridos cuando existe el paciente
                DataValidator.validateApiResponse(data, ['idPersona', 'nombre']);

                // Verificar si es ISSFA sin Club Medical (caso bloqueado)
                if (data.issfa && !data.clubMedical) {
                    Utils.mostrarError(`${data.nombre}, usted es paciente ISSFA, por favor acercarse a la ventanilla para agendar una cita.`);
                    return;
                }

                // Para todos los demás casos, continuamos normalmente
                UIManager.estado.currentPatientId = data.idPersona;
                UIManager.estado.currentPatientName = data.nombre;
                UIManager.elementos.patientNameSpan.textContent = data.nombre;

                Logger.success('Paciente verificado:', { id: data.idPersona, issfa: data.issfa, clubMedical: data.clubMedical });

                await AppController.cargarEspecialidades();
            } else {
                Utils.mostrarError('Paciente no encontrado. Si eres nuevo, por favor regístrate.');
            }
        } catch (error) {
            ErrorHandler.handle(error, 'verificarCedula');
        }
    }

    // Cargar especialidades
    static async cargarEspecialidades() {
        try {
            const especialidades = await ApiService.obtenerEspecialidades(UIManager.estado.currentPatientId);
            UIManager.renderizarEspecialidades(especialidades);
            Utils.mostrarPantalla('screen-especialidad');
        } catch (error) {
            Utils.mostrarError(error.message);
        }
    }

    // Cargar doctores por especialidad
    static async cargarDoctores(idEspecialidad) {
        try {
            console.log('🔍 Cargando doctores para especialidad:', idEspecialidad);
            
            // Verificar que el elemento de doctores existe
            if (!UIManager.elementos.doctoresGrid) {
                console.error('❌ Elemento doctors-grid no encontrado en UIManager.elementos');
                // Intentar encontrar el elemento directamente
                const doctorsGrid = document.getElementById('doctors-grid');
                if (doctorsGrid) {
                    UIManager.elementos.doctoresGrid = doctorsGrid;
                    console.log('✅ Elemento doctors-grid encontrado directamente');
                } else {
                    console.error('❌ Elemento doctors-grid no existe en el DOM');
                    Utils.mostrarError('Error: Pantalla de doctores no disponible');
                    return;
                }
            }
            
            const doctores = await ApiService.obtenerDoctores(idEspecialidad);
            UIManager.renderizarDoctores(doctores);
            Utils.mostrarPantalla('screen-doctores');
        } catch (error) {
            console.error('❌ Error en cargarDoctores:', error);
            Utils.mostrarError(error.message);
        }
    }

    // Cargar fechas por médico
    static async cargarFechas(idMedico) {
        UIManager.estado.selectedMedicoId = idMedico;
        
        try {
            const fechas = await ApiService.obtenerFechas(idMedico);
            UIManager.renderizarFechas(fechas);
            Utils.mostrarPantalla('screen-fechas');
        } catch (error) {
            Utils.mostrarError(error.message);
        }
    }

    // Cargar horas por médico y fecha
    static async cargarHoras(idMedico, fecha) {
        try {
            const horas = await ApiService.obtenerHoras(idMedico, fecha);
            UIManager.renderizarHoras(horas);
            Utils.mostrarPantalla('screen-horas');
        } catch (error) {
            Utils.mostrarError(error.message);
        }
    }

    // Cargar exámenes de imagen
    static async cargarExamenesImagen() {
        try {
            const examenes = await ApiService.obtenerExamenesImagen();
            AppController.configurarPantallaExamenes('Exámenes de Imagenología', 'Elige el examen que necesitas.', examenes, 'ecografia');
        } catch (error) {
            Utils.mostrarError(error.message);
        }
    }

    // Cargar exámenes de laboratorio
    static async cargarExamenesLaboratorio() {
        try {
            const examenes = await ApiService.obtenerExamenesLaboratorio();
            AppController.configurarPantallaExamenes('Exámenes de Laboratorio', 'Elige el examen que necesitas.', examenes, 'laboratorio');
        } catch (error) {
            Utils.mostrarError(error.message);
        }
    }

    // Cargar servicios odontológicos
    static async cargarServiciosOdontologia() {
        try {
            const servicios = await ApiService.obtenerServiciosOdontologia();
            AppController.configurarPantallaExamenes('Servicios Odontológicos', 'Elige el servicio dental que necesitas.', servicios, 'odontologia');
        } catch (error) {
            Utils.mostrarError(error.message);
        }
    }

    // Cargar procedimientos de rayos X
    static async cargarRayosX() {
        try {
            const procedimientos = await ApiService.obtenerRayosX();
            AppController.configurarPantallaExamenes('Procedimientos de Rayos X', 'Elige el procedimiento que necesitas.', procedimientos, 'rayosx');
        } catch (error) {
            Utils.mostrarError(error.message);
        }
    }

    // Configurar pantalla de exámenes
    static configurarPantallaExamenes(titulo, subtitulo, datos, area) {
        // Limpiar búsqueda antes de configurar nueva área
        Utils.limpiarBusquedaCompleta();
        
        // Actualizar títulos
        document.querySelector('#screen-examenes h1').textContent = titulo;
        document.querySelector('#screen-examenes p').textContent = subtitulo;
        
        // Configurar área actual
        UIManager.estado.areaActual = area;
        UIManager.estado.datosAreaActual = datos;
        window.datosAreaActual = datos; // Para compatibilidad con búsqueda

        // Renderizar datos
        AppController.renderizarExamenes(datos);
        
        // Configurar búsqueda
        SearchEngine.inicializarBusqueda(AppController.renderizarExamenes);
        
        // Actualizar placeholder
        Utils.actualizarPlaceholder();
    }

    // Renderizar exámenes con búsqueda
    static renderizarExamenes(examenes, terminoBusqueda = '') {
        const examenesGrid = document.getElementById('examenes-grid');
        const contadorResultados = document.getElementById('contador-resultados');
        const limpiarBusqueda = document.getElementById('limpiar-busqueda');
        
        console.log('🔍 renderizarExamenes llamado:', {
            examenesRecibidos: examenes.length,
            terminoBusqueda: terminoBusqueda,
            datosAreaActual: window.datosAreaActual?.length || 0
        });
        
        Utils.limpiarContenedor(examenesGrid);

        if (examenes.length === 0) {
            examenesGrid.innerHTML = '<p class="text-gray-600 text-center py-8">No se encontraron exámenes que coincidan con tu búsqueda.</p>';
            contadorResultados.textContent = '0 resultados';
            if (limpiarBusqueda) limpiarBusqueda.classList.add('hidden');
            return;
        }

        // Mostrar contador de resultados
        const totalExamenes = examenes.length;
        contadorResultados.textContent = terminoBusqueda 
            ? `${totalExamenes} resultado${totalExamenes !== 1 ? 's' : ''} para "${terminoBusqueda}"`
            : `${totalExamenes} exámenes disponibles`;

        // Mostrar botón de limpiar búsqueda si hay término de búsqueda
        if (limpiarBusqueda) {
            limpiarBusqueda.classList.toggle('hidden', !terminoBusqueda);
        }

        // IMPORTANTE: Siempre usar los examenes recibidos como parámetro, no window.datosAreaActual
        // Renderizar según el área y si hay búsqueda
        if (terminoBusqueda) {
            // Con búsqueda: mostrar todos los resultados sin categorías
            console.log('📋 Renderizando con búsqueda:', terminoBusqueda, 'resultados:', examenes.length);
            AppController.renderizarResultadosBusqueda(examenes, examenesGrid);
        } else {
            // Sin búsqueda: mostrar por categorías según el área
            console.log('📋 Renderizando sin búsqueda, categorías');
            AppController.renderizarPorCategorias(examenes, examenesGrid);
        }
    }

    // Renderizar resultados de búsqueda
    static renderizarResultadosBusqueda(examenes, contenedor) {
        const area = UIManager.estado.areaActual;
        
        examenes.forEach(examen => {
            let listItem;
            if (area === 'odontologia') {
                // Para odontología, usar el renderizado específico de servicios
                listItem = AppController.crearItemServicioOdontologia(examen);
            } else {
                // Para laboratorio e imagenología, usar el renderizado de exámenes
                listItem = AppController.crearItemExamen(examen);
            }
            contenedor.appendChild(listItem);
        });
    }

    // Renderizar por categorías
    static renderizarPorCategorias(examenes, contenedor) {
        const area = UIManager.estado.areaActual;
        
        console.log('📋 Renderizando por categorías:', {
            area: area,
            examenesRecibidos: examenes.length,
            datosAreaActual: window.datosAreaActual?.length || 0
        });
        
        if (area === 'laboratorio') {
            const categorias = SearchEngine.clasificarExamenesPorCategoria(examenes, area);
            AppController.renderizarCategoriasLaboratorio(categorias, contenedor);
        } else if (area === 'odontologia') {
            const categorias = SearchEngine.clasificarServiciosOdontologia(examenes);
            AppController.renderizarCategoriasOdontologia(categorias, contenedor);
        } else if (area === 'rayosx') {
            const categorias = SearchEngine.clasificarProcedimientosRayosX(examenes);
            AppController.renderizarCategoriasRayosX(categorias, contenedor);
        } else if (area === 'ecografia') {
            const categorias = SearchEngine.clasificarExamenesEcografia(examenes);
            AppController.renderizarCategoriasEcografia(categorias, contenedor);
        } else {
            // Para otras áreas, mostrar sin categorías
            // IMPORTANTE: Usar solo los exámenes recibidos, no todos los datos
            console.log('📋 Renderizando sin categorías:', examenes.length, 'exámenes');
            examenes.forEach(examen => {
                const listItem = AppController.crearItemExamen(examen);
                contenedor.appendChild(listItem);
            });
        }
    }

    // Renderizar categorías de laboratorio
    static renderizarCategoriasLaboratorio(categorias, contenedor) {
        Object.entries(categorias).forEach(([categoria, examenesCategoria]) => {
            if (examenesCategoria.length > 0) {
                // Añadir título de categoría con estilo azul unificado
                const tituloCategoria = Utils.crearElemento('h2', 'text-2xl font-bold text-blue-800 mt-8 mb-4 pt-6 border-t-2 border-blue-200', categoria);
                contenedor.appendChild(tituloCategoria);

                // Añadir exámenes de la categoría
                examenesCategoria.forEach(examen => {
                    const listItem = AppController.crearItemExamen(examen);
                    contenedor.appendChild(listItem);
                });
            }
        });
    }

    // Renderizar categorías de odontología
    static renderizarCategoriasOdontologia(categorias, contenedor) {
        Object.entries(categorias).forEach(([categoria, serviciosCategoria]) => {
            if (serviciosCategoria.length > 0) {
                // Añadir título de categoría con estilo azul unificado
                const tituloCategoria = Utils.crearElemento('h2', 'text-2xl font-bold text-blue-800 mt-8 mb-4 pt-6 border-t-2 border-blue-200', categoria);
                contenedor.appendChild(tituloCategoria);

                // Añadir servicios de la categoría
                serviciosCategoria.forEach(servicio => {
                    const serviceContainer = AppController.crearItemServicioOdontologia(servicio);
                    contenedor.appendChild(serviceContainer);
                });
            }
        });
    }

    // Renderizar categorías de Rayos X
    static renderizarCategoriasRayosX(categorias, contenedor) {
        Object.entries(categorias).forEach(([categoria, procedimientosCategoria]) => {
            if (procedimientosCategoria.length > 0) {
                // Añadir título de categoría con estilo azul unificado
                const tituloCategoria = Utils.crearElemento('h2', 'text-2xl font-bold text-blue-800 mt-8 mb-4 pt-6 border-t-2 border-blue-200', categoria);
                contenedor.appendChild(tituloCategoria);

                // Añadir procedimientos de la categoría
                procedimientosCategoria.forEach(procedimiento => {
                    const listItem = AppController.crearItemExamen(procedimiento);
                    contenedor.appendChild(listItem);
                });
            }
        });
    }

    // Renderizar categorías de ecografía
    static renderizarCategoriasEcografia(categorias, contenedor) {
        Object.entries(categorias).forEach(([categoria, examenesCategoria]) => {
            if (examenesCategoria.length > 0) {
                // Añadir título de categoría con estilo azul unificado
                const tituloCategoria = Utils.crearElemento('h2', 'text-2xl font-bold text-blue-800 mt-8 mb-4 pt-6 border-t-2 border-blue-200', categoria);
                contenedor.appendChild(tituloCategoria);

                // Añadir exámenes de la categoría
                examenesCategoria.forEach(examen => {
                    const listItem = AppController.crearItemExamen(examen);
                    contenedor.appendChild(listItem);
                });
            }
        });
    }

    // Crear item de examen
    static crearItemExamen(examen) {
        const listItem = Utils.crearElemento('div', 'w-full flex items-center bg-white p-3 rounded-lg shadow');

        const nameDiv = Utils.crearElemento('div', 'flex-grow pr-4');
        const nombreMostrar = examen.descripcion_visible || examen.descripcion;
        nameDiv.innerHTML = `<h3 class="text-md font-semibold text-gray-800">${nombreMostrar}</h3>`;
        
        const buttonsDiv = Utils.crearElemento('div', 'flex items-center space-x-2 flex-shrink-0');
        buttonsDiv.innerHTML = AppController.crearBotonesPrecio(examen);
        
        listItem.appendChild(nameDiv);
        listItem.appendChild(buttonsDiv);
        
        return listItem;
    }

    // Crear item de servicio odontológico
    static crearItemServicioOdontologia(servicio) {
        const serviceContainer = Utils.crearElemento('div', 'bg-white rounded-lg shadow mb-4 overflow-hidden');
        
        // Título del servicio
        const serviceHeader = Utils.crearElemento('div', 'bg-gray-50 px-4 py-3 border-b border-gray-200');
        serviceHeader.innerHTML = `
            <h3 class="text-lg font-bold text-gray-800">${servicio.servicio}</h3>
            ${servicio.encontrado ? '' : '<p class="text-xs text-red-500 mt-1">⚠️ Servicio no encontrado en BD</p>'}
            ${servicio.total_opciones > 1 ? `<p class="text-xs text-blue-600 mt-1">${servicio.total_opciones} opciones disponibles</p>` : ''}
        `;
        
        serviceContainer.appendChild(serviceHeader);
        
        // Contenedor para las opciones
        const optionsContainer = Utils.crearElemento('div', 'space-y-2 p-4');
        
        if (servicio.encontrado && servicio.opciones) {
            servicio.opciones.forEach(opcion => {
                const optionItem = AppController.crearOpcionServicio(opcion);
                optionsContainer.appendChild(optionItem);
            });
        } else {
            const notFoundMessage = Utils.crearElemento('div', 'text-center py-4');
            notFoundMessage.innerHTML = `
                <button class="py-2 px-4 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed" disabled>
                    No disponible
                </button>
            `;
            optionsContainer.appendChild(notFoundMessage);
        }
        
        serviceContainer.appendChild(optionsContainer);
        return serviceContainer;
    }

    // Crear opción de servicio
    static crearOpcionServicio(opcion) {
        const optionItem = Utils.crearElemento('div', 'flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg');
        
        const optionName = Utils.crearElemento('div', 'flex-grow pr-4');
        optionName.innerHTML = `
            <p class="text-sm font-medium text-gray-700">${opcion.descripcion_bd}</p>
        `;
        
        const optionButtons = Utils.crearElemento('div', 'flex items-center space-x-2 flex-shrink-0');
        optionButtons.innerHTML = AppController.crearBotonesPrecio(opcion, 'odontologia');
        
        optionItem.appendChild(optionName);
        optionItem.appendChild(optionButtons);
        
        return optionItem;
    }

    // Crear botones de precio (unificado para exámenes y odontología)
    static crearBotonesPrecio(item, tipo = 'examen') {
        // Determinar descripción y función según el tipo
        const descripcion = tipo === 'odontologia' ? item.descripcion_bd : item.descripcion;
        const funcionSeleccion = tipo === 'odontologia' ? 'seleccionarServicioOdontologia' : 'seleccionarExamen';
        
        // Determinar tamaño de botones según el tipo
        const sizeClasses = tipo === 'odontologia' 
            ? 'py-1 px-3 rounded text-xs'  // Más pequeño para odontología
            : 'py-2 px-4 rounded-lg text-sm'; // Normal para exámenes
        
        return `
            <button class="${sizeClasses} bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors" 
                    onclick="AppController.${funcionSeleccion}('${descripcion}', ${item.precio_particular}, 'particular')">
                Particular: ${item.precio_particular.toFixed(2)}
            </button>
            <button class="${sizeClasses} bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors" 
                    onclick="AppController.${funcionSeleccion}('${descripcion}', ${item.precio_club}, 'club')">
                Club: ${item.precio_club.toFixed(2)}
            </button>
        `;
    }

    // Seleccionar examen
    static seleccionarExamen(descripcion, precio, tipo) {
        if (tipo === 'club') {
            if (!UIManager.estado.currentPatientId) {
                UIManager.mostrarModalClubMedical();
                return;
            }
            // Aquí se debería verificar si realmente es Club Medical
            UIManager.mostrarModalClubMedical();
            return;
        }
        
        console.log(`Examen seleccionado: ${descripcion}, Precio: ${precio}, Tipo: ${tipo}`);
        Utils.mostrarExito(`Has seleccionado: ${descripcion}\nPrecio: $${precio.toFixed(2)}`);
    }

    // Seleccionar servicio odontológico
    static seleccionarServicioOdontologia(servicio, precio, tipo) {
        if (tipo === 'club') {
            if (!UIManager.estado.currentPatientId) {
                UIManager.mostrarModalClubMedical();
                return;
            }
            // Aquí se debería verificar si realmente es Club Medical
            UIManager.mostrarModalClubMedical();
            return;
        }
        
        console.log(`Servicio odontológico seleccionado: ${servicio}, Precio: ${precio}, Tipo: ${tipo}`);
        Utils.mostrarExito(`Has seleccionado: ${servicio}\nPrecio: $${precio.toFixed(2)}`);
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    AppController.inicializar();
});

// Funciones globales para uso en HTML
function showScreen(screenId) {
    Utils.mostrarPantalla(screenId);
}

function showModal() {
    UIManager.mostrarModalClubMedical();
}

function closeModal() {
    UIManager.cerrarModal();
}

// Exportar para uso global
window.AppController = AppController;
