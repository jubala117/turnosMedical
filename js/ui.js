// Módulo de interfaz de usuario y renderizado

class UIManager {
    // Estado global de la aplicación
    static estado = {
        currentPatientId: null,
        currentPatientName: null,
        selectedMedicoId: null,
        selectedEspecialidad: null,
        selectedPrecio: null,
        selectedTipoPrecio: null,
        areaActual: null,
        datosAreaActual: []
    };

    // Referencias a elementos DOM
    static elementos = {
        cedulaInput: null,
        verificarBtn: null,
        patientNameSpan: null,
        specialtiesGrid: null,
        doctorsGrid: null,
        datesGrid: null,
        hoursGrid: null,
        examenesGrid: null
    };

    // Inicializar referencias DOM
    static inicializarReferencias() {
        UIManager.elementos = {
            cedulaInput: document.getElementById('cedula-input'),
            verificarBtn: document.querySelector('#screen-cedula .btn-primary'),
            patientNameSpan: document.getElementById('patient-name'),
            specialtiesGrid: document.getElementById('specialties-grid'),
            doctorsGrid: document.getElementById('doctors-grid'),
            datesGrid: document.getElementById('dates-grid'),
            hoursGrid: document.getElementById('hours-grid'),
            examenesGrid: document.getElementById('examenes-grid'),
            errorMessage: document.getElementById('error-message'),
            successMessage: document.getElementById('success-message'),
            buscarInput: document.getElementById('buscar-examen'),
            limpiarBusqueda: document.getElementById('limpiar-busqueda'),
            contadorResultados: document.getElementById('contador-resultados'),
            tituloExamenes: document.getElementById('titulo-examenes'),
            subtituloExamenes: document.getElementById('subtitulo-examenes')
        };

        // Validar que los elementos críticos existan
        const elementosCriticos = ['specialtiesGrid', 'doctorsGrid', 'datesGrid', 'hoursGrid', 'examenesGrid'];
        elementosCriticos.forEach(elemento => {
            if (!UIManager.elementos[elemento]) {
                console.error(`❌ Elemento crítico no encontrado: ${elemento}`);
            }
        });
    }

    // Renderizar especialidades
    static renderizarEspecialidades(especialidades) {
        Utils.limpiarContenedor(UIManager.elementos.specialtiesGrid);

        especialidades.forEach(especialidad => {
            const card = UIManager.crearCardEspecialidad(especialidad);
            UIManager.elementos.specialtiesGrid.appendChild(card);
        });
    }

    // Crear card de especialidad
    static crearCardEspecialidad(especialidad) {
        const card = Utils.crearElemento('div', 'card-primary flex flex-col');
        card.style.height = '320px';
        card.dataset.id = especialidad.idEspecialidad;

        const normalizedName = Utils.generarNombreImagen(especialidad.descEspecialidad);
        const imageName = normalizedName;

        // Lógica especial para categorías IMAGEN, LABORATORIO, ODONTOLOGÍA y RAYOS X
        if (normalizedName === 'imagen' || normalizedName === 'laboratorio' || normalizedName === 'odontologia' || normalizedName === 'rayos_x') {
            card.innerHTML = UIManager.crearHTMLCategoriaEspecial(especialidad, normalizedName, imageName);
            card.addEventListener('click', () => UIManager.manejarCategoriaEspecial(normalizedName));
        } else {
            // Lógica para especialidades normales con precios
            // Usar el campo tieneOpciones que viene del backend
            const esEspecialidadConOpciones = especialidad.tieneOpciones === true || (especialidad.opciones && especialidad.opciones.length > 0);
            const preciosHTML = UIManager.crearHTMLPrecios(especialidad, esEspecialidadConOpciones);

            card.innerHTML = UIManager.crearHTMLEspecialidadNormal(especialidad, imageName, preciosHTML);

            if (esEspecialidadConOpciones) {
                UIManager.configurarEventosOpciones(card, especialidad);
            } else {
                UIManager.configurarEventosPrecios(card, especialidad);
            }
        }

        return card;
    }

    // Crear HTML para categorías especiales
    static crearHTMLCategoriaEspecial(especialidad, normalizedName, imageName) {
        let icono = 'fa-flask'; // Por defecto para laboratorio
        if (normalizedName === 'imagen') icono = 'fa-x-ray';
        if (normalizedName === 'rayos_x') icono = 'fa-x-ray';
        if (normalizedName === 'odontologia') icono = 'fa-tooth';
        
        return `
            <div class="flex-1 relative overflow-hidden rounded-t-xl">
                <img src="images/${imageName}.png" alt="${especialidad.descEspecialidad}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <i class="fas ${icono} text-5xl text-blue-800 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style="display: none;"></i>
            </div>
            <div class="p-4 text-center">
                <h3 class="text-base font-bold text-gray-800 leading-tight mb-4">${especialidad.descEspecialidad}</h3>
                <button class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors">
                    Ver Exámenes
                </button>
            </div>
        `;
    }

    // Crear HTML para especialidades normales
    static crearHTMLEspecialidadNormal(especialidad, imageName, preciosHTML) {
        return `
            <div class="flex-1 relative overflow-hidden rounded-t-xl">
                <img src="images/${imageName}.png" alt="${especialidad.descEspecialidad}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <i class="fas fa-stethoscope text-5xl text-blue-800 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style="display: none;"></i>
            </div>
            <div class="p-4 text-center">
                <h3 class="text-base font-bold text-gray-800 leading-tight">${especialidad.descEspecialidad}</h3>
                ${preciosHTML}
            </div>
        `;
    }

    // Crear HTML de precios
    static crearHTMLPrecios(especialidad, esEspecialidadConOpciones) {
        if (!especialidad.precios || !especialidad.precios.particular) {
            return '<p class="text-sm text-red-500 mt-4">Precios no disponibles</p>';
        }

        if (esEspecialidadConOpciones) {
            return `
                <div class="mt-3">
                    <button class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors ver-opciones-btn" data-especialidad="${especialidad.idEspecialidad}">
                        Ver Opciones
                    </button>
                </div>
            `;
        } else {
            const precios = especialidad.precios;
            const precioRegular = precios.particular;
            const precioClub = precios.clubMedical || 'N/A';

            return `
                <div class="mt-3 space-y-2">
                    <button class="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors precio-btn" data-tipo="regular" data-precio="${precioRegular}" data-especialidad="${especialidad.idEspecialidad}">
                        Precio particular: ${precioRegular}
                    </button>
                    <button class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors precio-btn" data-tipo="club" data-precio="${precioClub}" data-especialidad="${especialidad.idEspecialidad}">
                        Club Medical: ${precioClub}
                    </button>
                </div>
            `;
        }
    }

    // Configurar eventos para opciones múltiples
    static configurarEventosOpciones(card, especialidad) {
        const verOpcionesBtn = card.querySelector('.ver-opciones-btn');
        verOpcionesBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await UIManager.mostrarOpcionesEspecialidad(especialidad);
        });
    }

    // Configurar eventos para precios directos
    static configurarEventosPrecios(card, especialidad) {
        card.querySelectorAll('.precio-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const tipo = btn.dataset.tipo;
                const precio = btn.dataset.precio;
                const especialidadId = btn.dataset.especialidad;

                if (tipo === 'club') {
                    if (!especialidad.precios?.esClubMedical) {
                        UIManager.mostrarModalClubMedical();
                        return;
                    }
                }

                UIManager.estado.selectedEspecialidad = especialidadId;
                UIManager.estado.selectedPrecio = precio;
                UIManager.estado.selectedTipoPrecio = tipo;
                await AppController.cargarDoctores(especialidadId);
            });
        });
    }

    // Manejar categorías especiales
    static async manejarCategoriaEspecial(normalizedName) {
        if (normalizedName === 'imagen') {
            await AppController.cargarExamenesImagen();
        } else if (normalizedName === 'laboratorio') {
            await AppController.cargarExamenesLaboratorio();
        } else if (normalizedName === 'odontologia') {
            await AppController.cargarServiciosOdontologia();
        } else if (normalizedName === 'rayos_x') {
            await AppController.cargarRayosX();
        }
        Utils.mostrarPantalla('screen-examenes');
    }

    // Renderizar doctores
    static renderizarDoctores(doctores) {
        Utils.limpiarContenedor(UIManager.elementos.doctoresGrid);

        if (doctores.length === 0) {
            UIManager.elementos.doctoresGrid.innerHTML = '<p class="text-gray-600 col-span-full">No hay doctores con agenda disponible para esta especialidad.</p>';
            return;
        }

        doctores.forEach(doctor => {
            const card = UIManager.crearCardDoctor(doctor);
            UIManager.elementos.doctoresGrid.appendChild(card);
        });
    }

    // Crear card de doctor
    static crearCardDoctor(doctor) {
        const card = Utils.crearElemento('div', 'card-primary p-8 text-center');
        card.dataset.id = doctor.idMedico;
        
        card.innerHTML = `
            <i class="fas fa-user-md text-5xl text-blue-800 mb-4"></i>
            <h3 class="text-xl font-bold">${doctor.nombreCompleto}</h3>
        `;
        
        card.addEventListener('click', async () => {
            await AppController.cargarFechas(doctor.idMedico);
        });

        return card;
    }

    // Renderizar fechas
    static renderizarFechas(fechas) {
        Utils.limpiarContenedor(UIManager.elementos.datesGrid);

        if (fechas.length === 0) {
            UIManager.elementos.datesGrid.innerHTML = '<p class="text-gray-600 col-span-full">No hay fechas disponibles para este médico.</p>';
            return;
        }

        fechas.forEach(fecha => {
            const card = UIManager.crearCardFecha(fecha);
            UIManager.elementos.datesGrid.appendChild(card);
        });
    }

    // Crear card de fecha
    static crearCardFecha(fecha) {
        const card = Utils.crearElemento('div', 'card-primary p-6 text-center');
        card.dataset.date = fecha.fechaHorario;
        
        card.innerHTML = `
            <i class="fas fa-calendar-alt text-5xl text-blue-800 mb-4"></i>
            <h3 class="text-lg font-bold">${Utils.fechaLetras(fecha.fechaHorario)}</h3>
        `;
        
        card.addEventListener('click', async () => {
            await AppController.cargarHoras(UIManager.estado.selectedMedicoId, fecha.fechaHorario);
        });

        return card;
    }

    // Renderizar horas
    static renderizarHoras(horas) {
        Utils.limpiarContenedor(UIManager.elementos.hoursGrid);

        if (horas.length === 0) {
            UIManager.elementos.hoursGrid.innerHTML = '<p class="text-gray-600 col-span-full">No hay horas disponibles para esta fecha.</p>';
            return;
        }

        horas.forEach(hora => {
            const button = UIManager.crearBotonHora(hora);
            UIManager.elementos.hoursGrid.appendChild(button);
        });
    }

    // Crear botón de hora
    static crearBotonHora(hora) {
        const button = Utils.crearElemento('button', 'btn-primary');
        button.dataset.id = hora.idHorarioMedico;
        button.textContent = hora.hora;
        
        button.addEventListener('click', () => {
            console.log(`Cita seleccionada: Médico ${UIManager.estado.selectedMedicoId}, Fecha ${fecha}, Hora ${hora.hora}`);
            Utils.mostrarPantalla('screen-pago');
        });

        return button;
    }

    // Mostrar modal de Club Medical
    static mostrarModalClubMedical() {
        document.getElementById('modal-club-medical').classList.remove('hidden');
    }

    // Cerrar modal
    static cerrarModal() {
        document.getElementById('modal-club-medical').classList.add('hidden');
    }

    // Mostrar opciones de especialidad
    static async mostrarOpcionesEspecialidad(especialidad) {
        // Usar las opciones que vienen del backend
        const opciones = especialidad.opciones;

        if (!opciones || opciones.length === 0) {
            ToastNotification.warning('No hay opciones disponibles para esta especialidad');
            return;
        }

        // Crear y mostrar modal con opciones
        UIManager.mostrarModalOpciones(especialidad, opciones);
    }

    // Mostrar modal de opciones
    static mostrarModalOpciones(especialidad, opciones) {
        // Crear overlay del modal
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modalOverlay.id = 'modal-opciones-especialidad';

        // Crear contenido del modal
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto';

        // Header del modal
        const modalHeader = document.createElement('div');
        modalHeader.className = 'bg-blue-600 text-white p-6 rounded-t-lg';
        modalHeader.innerHTML = `
            <h2 class="text-2xl font-bold">${especialidad.descEspecialidad}</h2>
            <p class="text-blue-100 mt-2">Selecciona una opción para continuar</p>
        `;

        // Body del modal con opciones
        const modalBody = document.createElement('div');
        modalBody.className = 'p-6 space-y-4';

        opciones.forEach((opcion, index) => {
            const opcionCard = document.createElement('div');
            opcionCard.className = 'border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors';

            const opcionHeader = document.createElement('h3');
            opcionHeader.className = 'text-lg font-bold text-gray-800 mb-3';
            opcionHeader.textContent = opcion.nombre;

            const botonesContainer = document.createElement('div');
            botonesContainer.className = 'flex gap-3';

            // Botón Particular
            if (opcion.particular !== null) {
                const btnParticular = document.createElement('button');
                btnParticular.className = 'flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors';
                btnParticular.innerHTML = `
                    <div class="text-xs text-gray-600 mb-1">Precio Particular</div>
                    <div class="text-lg font-bold">$${opcion.particular.toFixed(2)}</div>
                `;
                btnParticular.addEventListener('click', () => {
                    UIManager.seleccionarOpcion(especialidad, opcion, 'particular');
                    modalOverlay.remove();
                });
                botonesContainer.appendChild(btnParticular);
            }

            // Botón Club Medical
            if (opcion.clubMedical !== null) {
                const btnClub = document.createElement('button');
                btnClub.className = 'flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors';
                btnClub.innerHTML = `
                    <div class="text-xs text-blue-100 mb-1">Club Medical</div>
                    <div class="text-lg font-bold">$${opcion.clubMedical.toFixed(2)}</div>
                `;
                btnClub.addEventListener('click', () => {
                    // Verificar si es miembro de Club Medical
                    if (!opcion.esClubMedical) {
                        modalOverlay.remove();
                        UIManager.mostrarModalClubMedical();
                        return;
                    }
                    UIManager.seleccionarOpcion(especialidad, opcion, 'club');
                    modalOverlay.remove();
                });
                botonesContainer.appendChild(btnClub);
            }

            opcionCard.appendChild(opcionHeader);
            opcionCard.appendChild(botonesContainer);
            modalBody.appendChild(opcionCard);
        });

        // Footer del modal
        const modalFooter = document.createElement('div');
        modalFooter.className = 'bg-gray-50 p-4 rounded-b-lg border-t border-gray-200';
        const btnCancelar = document.createElement('button');
        btnCancelar.className = 'w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors';
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.addEventListener('click', () => modalOverlay.remove());
        modalFooter.appendChild(btnCancelar);

        // Ensamblar modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalOverlay.appendChild(modalContent);

        // Agregar al DOM
        document.body.appendChild(modalOverlay);

        // Cerrar al hacer click fuera del modal
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
    }

    // Seleccionar opción de especialidad
    static async seleccionarOpcion(especialidad, opcion, tipo) {
        UIManager.estado.selectedEspecialidad = especialidad.idEspecialidad;
        UIManager.estado.selectedPrecio = tipo === 'club' ? opcion.clubMedical : opcion.particular;
        UIManager.estado.selectedTipoPrecio = tipo;
        UIManager.estado.selectedOpcionNombre = opcion.nombre;
        UIManager.estado.selectedIdTipoServicio = tipo === 'club' ? opcion.idTipoServicioClub : opcion.idTipoServicioRegular;

        ToastNotification.success(`Seleccionado: ${opcion.nombre} - $${UIManager.estado.selectedPrecio.toFixed(2)}`);

        await AppController.cargarDoctores(especialidad.idEspecialidad);
    }
}

// Exportar para uso global
window.UIManager = UIManager;
