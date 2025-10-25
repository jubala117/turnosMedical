/**
 * Dashboard de Administración - Kiosco Medical Care
 * Gestión visual de especialidades sin necesidad de tocar código
 */

const API_BASE = 'api';

// Estado global
const state = {
    especialidades: [],
    currentFilter: 'all',
    currentTipo: 'all',
    searchTerm: '',
    editingId: null,
    opciones: [] // Opciones para la especialidad actual
};

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initFilters();
    initForm();
    loadData();
});

// =============================================================================
// NAVEGACIÓN DE TABS
// =============================================================================

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-gray-600');
    });

    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    activeBtn.classList.add('active', 'border-blue-600', 'text-blue-600');
    activeBtn.classList.remove('border-transparent', 'text-gray-600');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

// =============================================================================
// CARGA DE DATOS
// =============================================================================

async function loadData() {
    try {
        await loadEspecialidades();
        renderEspecialidades();
        updateStats();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error al cargar datos', 'error');
    }
}

async function loadEspecialidades() {
    const response = await fetch(`${API_BASE}/especialidades_config.php`);
    const data = await response.json();

    if (data.success) {
        state.especialidades = data.data;
    } else {
        throw new Error(data.error || 'Error al cargar especialidades');
    }
}

// =============================================================================
// RENDERIZADO
// =============================================================================

function renderEspecialidades() {
    const container = document.getElementById('especialidades-container');

    // Filtrar especialidades
    let filtered = state.especialidades.filter(esp => {
        // Filtro de estado
        if (state.currentFilter === 'active' && !esp.activo) return false;
        if (state.currentFilter === 'inactive' && esp.activo) return false;

        // Filtro de tipo
        if (state.currentTipo !== 'all' && esp.tipo_seccion !== state.currentTipo) return false;

        // Búsqueda
        if (state.searchTerm) {
            const term = state.searchTerm.toLowerCase();
            if (!esp.nombre_especialidad.toLowerCase().includes(term)) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-600 text-lg">No se encontraron especialidades</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(esp => createEspecialidadCard(esp)).join('');

    // Inicializar drag & drop
    initSortable();
}

// =============================================================================
// DRAG & DROP (REORDENAMIENTO)
// =============================================================================

let sortableInstance = null;

function initSortable() {
    const container = document.getElementById('especialidades-container');

    // Destruir instancia anterior si existe
    if (sortableInstance) {
        sortableInstance.destroy();
    }

    // Solo inicializar si hay elementos
    const items = container.querySelectorAll('.specialty-card');
    if (items.length === 0) {
        return;
    }

    // Crear nueva instancia de Sortable
    sortableInstance = Sortable.create(container, {
        animation: 200,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        forceFallback: true,
        fallbackTolerance: 3,
        touchStartThreshold: 5,
        delay: 0,
        delayOnTouchOnly: false,
        onStart: function(evt) {
            console.log('Drag started', evt.item);
        },
        onEnd: async (evt) => {
            console.log('Drag ended', evt.oldIndex, '->', evt.newIndex);
            if (evt.oldIndex !== evt.newIndex) {
                await saveNewOrder();
            }
        }
    });

    console.log('SortableJS initialized with', items.length, 'items');
}

async function saveNewOrder() {
    const container = document.getElementById('especialidades-container');
    const cards = container.querySelectorAll('.specialty-card');

    // Crear array con el nuevo orden
    const newOrder = Array.from(cards).map((card, index) => ({
        id: parseInt(card.dataset.id),
        orden: index + 1
    }));

    try {
        const response = await fetch(`${API_BASE}/especialidades_config.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'reorder',
                order: newOrder
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Orden guardado correctamente', 'success');
            // Actualizar el estado local
            await loadEspecialidades();
        } else {
            showToast('Error al guardar el orden', 'error');
            // Recargar para restaurar el orden original
            renderEspecialidades();
        }
    } catch (error) {
        console.error('Error saving order:', error);
        showToast('Error al guardar el orden', 'error');
        renderEspecialidades();
    }
}

function createEspecialidadCard(esp) {
    const statusBadge = esp.activo
        ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Activo</span>'
        : '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Inactivo</span>';

    const tipoBadge = esp.tiene_opciones
        ? '<span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"><i class="fas fa-list mr-1"></i>Con opciones</span>'
        : '';

    const precioInfo = getPrecioInfo(esp);

    // Imagen personalizada o ícono por defecto
    const imagenHtml = esp.imagen_personalizada
        ? `<img src="../${esp.imagen_personalizada}" alt="${esp.nombre_especialidad}" class="w-16 h-16 object-cover rounded-lg border border-gray-200">`
        : `<div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
               <i class="fas fa-stethoscope text-3xl text-blue-600"></i>
           </div>`;

    return `
        <div class="specialty-card bg-white rounded-lg shadow hover:shadow-xl p-6" data-id="${esp.id}">
            <!-- Drag Handle -->
            <div class="drag-handle flex justify-center items-center mb-3 -mt-3" title="Arrastrar para reordenar">
                <i class="fas fa-grip-vertical text-gray-400 hover:text-blue-600 text-2xl"></i>
            </div>

            <!-- Header con imagen -->
            <div class="flex items-start mb-4 space-x-4">
                ${imagenHtml}
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${esp.nombre_especialidad}</h3>
                    <div class="flex flex-wrap gap-2">
                        ${statusBadge}
                        ${tipoBadge}
                    </div>
                </div>
            </div>

            <!-- Info -->
            <div class="space-y-2 mb-4">
                <div class="flex items-center text-sm text-gray-600">
                    <i class="fas fa-hashtag w-5"></i>
                    <span>ID: ${esp.id_especialidad}</span>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <i class="fas fa-layer-group w-5"></i>
                    <span>Tipo: ${getTipoLabel(esp.tipo_seccion)}</span>
                </div>
                ${precioInfo}
            </div>

            <!-- Actions -->
            <div class="flex space-x-2 border-t pt-4">
                <button onclick="editEspecialidad(${esp.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold">
                    <i class="fas fa-edit mr-1"></i>
                    Editar
                </button>
                <button onclick="toggleActive(${esp.id}, ${!esp.activo})" class="flex-1 ${esp.activo ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold">
                    <i class="fas fa-${esp.activo ? 'eye-slash' : 'eye'} mr-1"></i>
                    ${esp.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onclick="deleteEspecialidad(${esp.id}, '${esp.nombre_especialidad}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function getPrecioInfo(esp) {
    if (esp.tiene_opciones) {
        return `
            <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-list w-5"></i>
                <span>${esp.num_opciones || 0} opciones configuradas</span>
            </div>
        `;
    }

    if (esp.tipo_precio === 'fijo') {
        return `
            <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-dollar-sign w-5"></i>
                <span>Particular: $${esp.precio_particular_fijo} | Club: $${esp.precio_club_fijo}</span>
            </div>
        `;
    }

    if (esp.tipo_precio === 'id_bd') {
        return `
            <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-database w-5"></i>
                <span>IDs: ${esp.id_servicio_particular || 'N/A'} / ${esp.id_servicio_club || 'N/A'}</span>
            </div>
        `;
    }

    return '';
}

function getTipoLabel(tipo) {
    const labels = {
        'consulta': 'Consulta',
        'examen_lista': 'Exámenes (Lista)',
        'examen_categorizado': 'Exámenes (Categorizado)'
    };
    return labels[tipo] || tipo;
}

// =============================================================================
// ESTADÍSTICAS
// =============================================================================

function updateStats() {
    const total = state.especialidades.length;
    const activas = state.especialidades.filter(e => e.activo).length;
    const inactivas = total - activas;
    const conOpciones = state.especialidades.filter(e => e.tiene_opciones).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-activas').textContent = activas;
    document.getElementById('stat-inactivas').textContent = inactivas;
    document.getElementById('stat-opciones').textContent = conOpciones;
}

// =============================================================================
// FILTROS Y BÚSQUEDA
// =============================================================================

function initFilters() {
    document.getElementById('search-input').addEventListener('input', (e) => {
        state.searchTerm = e.target.value;
        renderEspecialidades();
    });

    document.getElementById('filter-status').addEventListener('change', (e) => {
        state.currentFilter = e.target.value;
        renderEspecialidades();
    });

    document.getElementById('filter-tipo').addEventListener('change', (e) => {
        state.currentTipo = e.target.value;
        renderEspecialidades();
    });
}

// =============================================================================
// MODAL Y FORMULARIO
// =============================================================================

function initForm() {
    document.getElementById('specialty-form').addEventListener('submit', handleSubmit);

    // Toggle precio tipo
    document.getElementById('form-tipo-precio').addEventListener('change', (e) => {
        const tipo = e.target.value;
        document.getElementById('precios-id-section').classList.toggle('hidden', tipo === 'fijo');
        document.getElementById('precios-fijo-section').classList.toggle('hidden', tipo === 'id_bd');
    });

    // Toggle opciones
    document.getElementById('form-tiene-opciones').addEventListener('change', (e) => {
        const tieneOpciones = e.target.checked;
        document.getElementById('precio-simple-section').classList.toggle('hidden', tieneOpciones);
        document.getElementById('opciones-section').classList.toggle('hidden', !tieneOpciones);
    });
}

function openModal(mode, id = null) {
    state.editingId = id;
    const modal = document.getElementById('specialty-modal');
    const title = document.getElementById('modal-title');

    if (mode === 'create') {
        title.textContent = 'Nueva Especialidad';
        document.getElementById('specialty-form').reset();
        document.getElementById('form-nombre-especialidad').value = '';
        hideImagePreview(); // Limpiar preview de imagen
        state.opciones = []; // Limpiar opciones
        renderizarOpciones();
    } else if (mode === 'edit') {
        title.textContent = 'Editar Especialidad';
        loadFormData(id);
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('specialty-modal').classList.remove('active');
    state.editingId = null;
}

function loadFormData(id) {
    const esp = state.especialidades.find(e => e.id === id);
    if (!esp) return;

    document.getElementById('form-id').value = esp.id;
    document.getElementById('form-nombre-especialidad').value = esp.nombre_especialidad;
    document.getElementById('form-tiene-opciones').checked = esp.tiene_opciones;

    // Cargar imagen personalizada si existe
    if (esp.imagen_personalizada) {
        document.getElementById('form-imagen-path').value = esp.imagen_personalizada;
        showImagePreview(esp.imagen_personalizada);
    } else {
        hideImagePreview();
    }

    if (!esp.tiene_opciones) {
        document.getElementById('form-tipo-precio').value = esp.tipo_precio;

        if (esp.tipo_precio === 'id_bd') {
            document.getElementById('form-id-particular').value = esp.id_servicio_particular || '';
            document.getElementById('form-id-club').value = esp.id_servicio_club || '';
        } else {
            document.getElementById('form-precio-particular').value = esp.precio_particular_fijo || '';
            document.getElementById('form-precio-club').value = esp.precio_club_fijo || '';
        }
    } else {
        // Cargar opciones desde el backend
        cargarOpciones(esp.id);
    }

    // Trigger change events
    document.getElementById('form-tipo-precio').dispatchEvent(new Event('change'));
    document.getElementById('form-tiene-opciones').dispatchEvent(new Event('change'));
}

async function cargarOpciones(especialidadId) {
    try {
        const response = await fetch(`${API_BASE}/especialidades_config.php?id=${especialidadId}`);
        const data = await response.json();

        console.log('📥 Respuesta de opciones:', data);

        if (data.success && data.data && data.data.opciones) {
            state.opciones = data.data.opciones.map(opc => ({
                id: opc.id,
                nombre: opc.nombre_opcion,
                tipo_precio: opc.tipo_precio,
                id_servicio_particular: opc.id_servicio_particular,
                id_servicio_club: opc.id_servicio_club,
                precio_particular_fijo: opc.precio_particular_fijo,
                precio_club_fijo: opc.precio_club_fijo,
                tabla_origen: opc.tabla_origen || 'servicio',
                orden: opc.orden
            }));
            console.log('✅ Opciones cargadas:', state.opciones);
            renderizarOpciones();
        } else {
            console.log('⚠️ No hay opciones para esta especialidad');
            state.opciones = [];
            renderizarOpciones();
        }
    } catch (error) {
        console.error('❌ Error cargando opciones:', error);
        state.opciones = [];
        renderizarOpciones();
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const nombreEspecialidad = document.getElementById('form-nombre-especialidad').value.trim();

    if (!nombreEspecialidad) {
        showToast('Por favor ingresa un nombre de especialidad', 'error');
        return;
    }

    const formData = {
        nombre_especialidad: nombreEspecialidad,
        activo: 1, // Siempre activo
        tipo_seccion: 'consulta', // Siempre consulta en la pestaña de especialidades
        tiene_opciones: document.getElementById('form-tiene-opciones').checked ? 1 : 0,
        mostrar_en_kiosco: 1,
        orden: 0,
        imagen_personalizada: document.getElementById('form-imagen-path').value || null
    };

    if (!formData.tiene_opciones) {
        formData.tipo_precio = document.getElementById('form-tipo-precio').value;

        if (formData.tipo_precio === 'id_bd') {
            formData.id_servicio_particular = parseInt(document.getElementById('form-id-particular').value) || null;
            formData.id_servicio_club = parseInt(document.getElementById('form-id-club').value) || null;
            formData.tabla_origen = 'servicio';
        } else {
            formData.precio_particular_fijo = parseFloat(document.getElementById('form-precio-particular').value) || null;
            formData.precio_club_fijo = parseFloat(document.getElementById('form-precio-club').value) || null;
        }
    } else {
        // Validar que haya al menos una opción
        if (state.opciones.length === 0) {
            showToast('Debes agregar al menos una opción', 'error');
            return;
        }

        // Validar que todas las opciones tengan nombre
        const opcionesSinNombre = state.opciones.filter(o => !o.nombre || o.nombre.trim() === '');
        if (opcionesSinNombre.length > 0) {
            showToast('Todas las opciones deben tener un nombre', 'error');
            return;
        }

        // Agregar opciones al formData
        formData.opciones = state.opciones.map((opc, index) => ({
            nombre_opcion: opc.nombre.trim(), // Nombre para el backend
            tipo_precio: opc.tipo_precio,
            id_servicio_particular: opc.id_servicio_particular,
            id_servicio_club: opc.id_servicio_club,
            precio_particular_fijo: opc.precio_particular_fijo,
            precio_club_fijo: opc.precio_club_fijo,
            tabla_origen: opc.tabla_origen || 'servicio',
            orden: index
        }));
    }

    console.log('📤 Enviando datos:', formData);

    try {
        const url = state.editingId
            ? `${API_BASE}/especialidades_config.php`
            : `${API_BASE}/especialidades_config.php`;

        const method = state.editingId ? 'PUT' : 'POST';

        if (state.editingId) {
            formData.id = state.editingId;
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);

        if (data.success) {
            showToast(state.editingId ? 'Especialidad actualizada' : 'Especialidad creada', 'success');
            closeModal();
            await loadData();
        } else {
            showToast(data.error || 'Error al guardar', 'error');
            console.error('❌ Error del servidor:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al guardar especialidad', 'error');
    }
}

// =============================================================================
// ACCIONES
// =============================================================================

function editEspecialidad(id) {
    openModal('edit', id);
}

async function toggleActive(id, newStatus) {
    try {
        const esp = state.especialidades.find(e => e.id === id);

        // Construir objeto con TODOS los datos para no perder información
        const updateData = {
            id: id,
            nombre_especialidad: esp.nombre_especialidad,
            activo: newStatus ? 1 : 0,
            orden: esp.orden || 0,
            tiene_opciones: esp.tiene_opciones ? 1 : 0,
            tipo_seccion: esp.tipo_seccion || 'consulta',
            mostrar_en_kiosco: 1,
            imagen_personalizada: esp.imagen_personalizada || null
        };

        // Agregar configuración de precios si existe
        if (!esp.tiene_opciones) {
            updateData.tipo_precio = esp.tipo_precio || 'id_bd';

            if (esp.tipo_precio === 'id_bd') {
                updateData.id_servicio_particular = esp.id_servicio_particular || null;
                updateData.id_servicio_club = esp.id_servicio_club || null;
                updateData.tabla_origen = esp.tabla_origen || 'servicio';
            } else {
                updateData.precio_particular_fijo = esp.precio_particular_fijo || null;
                updateData.precio_club_fijo = esp.precio_club_fijo || null;
            }
        }

        console.log('📤 Actualizando estado (preservando datos):', updateData);

        const response = await fetch(`${API_BASE}/especialidades_config.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (data.success) {
            showToast(newStatus ? 'Especialidad activada' : 'Especialidad desactivada', 'success');
            await loadData();
        } else {
            showToast(data.error || 'Error al cambiar estado', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cambiar estado', 'error');
    }
}

async function deleteEspecialidad(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/especialidades_config.php?id=${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('Especialidad eliminada', 'success');
            await loadData();
        } else {
            showToast(data.error || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar especialidad', 'error');
    }
}

// =============================================================================
// NOTIFICACIONES
// =============================================================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const messageEl = document.getElementById('toast-message');

    // Set icon and color
    if (type === 'success') {
        icon.className = 'fas fa-check-circle text-2xl';
        toast.className = 'fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle text-2xl';
        toast.className = 'fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg';
    }

    messageEl.textContent = message;

    // Show toast
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(5rem)';
        toast.style.opacity = '0';
    }, 3000);
}

// =============================================================================
// GESTIÓN DE IMÁGENES
// =============================================================================

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📸 Intentando subir imagen:', file.name, file.type, file.size);

    // Validar tamaño
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showToast('El archivo es demasiado grande. Máximo 5MB', 'error');
        return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Tipo de archivo no permitido. Solo JPG, PNG, GIF o WebP', 'error');
        return;
    }

    // Mostrar loading
    document.getElementById('upload-button-container').classList.add('hidden');
    document.getElementById('upload-loading').classList.remove('hidden');

    try {
        const formData = new FormData();
        formData.append('image', file);

        console.log('📤 Enviando imagen al servidor...');

        const response = await fetch(`${API_BASE}/upload_image.php`, {
            method: 'POST',
            body: formData
        });

        console.log('📥 Respuesta HTTP:', response.status, response.statusText);

        // Primero obtener el texto de la respuesta
        const responseText = await response.text();
        console.log('📥 Respuesta RAW del servidor:', responseText.substring(0, 500));

        // Intentar parsear como JSON
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('📥 Datos de respuesta (JSON):', data);
        } catch (e) {
            console.error('❌ ERROR: El servidor devolvió HTML en lugar de JSON');
            console.error('HTML completo:', responseText);
            showToast('Error del servidor. Revisa la consola (F12)', 'error');
            document.getElementById('upload-button-container').classList.remove('hidden');
            document.getElementById('upload-loading').classList.add('hidden');
            event.target.value = '';
            return;
        }

        if (data.success) {
            // Guardar path en campo oculto
            document.getElementById('form-imagen-path').value = data.path;

            // Mostrar preview
            showImagePreview(data.path);

            showToast('Imagen subida exitosamente', 'success');
        } else {
            showToast(data.error || 'Error al subir imagen', 'error');
            document.getElementById('upload-button-container').classList.remove('hidden');
        }
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        showToast('Error al subir imagen', 'error');
        document.getElementById('upload-button-container').classList.remove('hidden');
    } finally {
        document.getElementById('upload-loading').classList.add('hidden');
        // Limpiar input file
        event.target.value = '';
    }
}

function showImagePreview(imagePath) {
    const container = document.getElementById('image-preview-container');
    const preview = document.getElementById('image-preview');
    const previewName = document.getElementById('image-preview-name');

    // Construir URL completa
    const imageUrl = imagePath.startsWith('http') ? imagePath : `../${imagePath}`;

    preview.src = imageUrl;
    previewName.textContent = imagePath.split('/').pop();

    container.classList.remove('hidden');
    document.getElementById('upload-button-container').classList.add('hidden');
}

function hideImagePreview() {
    document.getElementById('image-preview-container').classList.add('hidden');
    document.getElementById('upload-button-container').classList.remove('hidden');
    document.getElementById('form-imagen-path').value = '';
}

function removeImage() {
    if (confirm('¿Eliminar la imagen personalizada? Se usará el ícono por defecto.')) {
        hideImagePreview();
        showToast('Imagen eliminada', 'success');
    }
}

// =============================================================================
// GESTIÓN DE OPCIONES MÚLTIPLES
// =============================================================================

function agregarOpcion() {
    const opcion = {
        id: Date.now(), // ID temporal único
        nombre: '',
        tipo_precio: 'id_bd',
        id_servicio_particular: null,
        id_servicio_club: null,
        precio_particular_fijo: null,
        precio_club_fijo: null,
        tabla_origen: 'servicio',
        orden: state.opciones.length
    };

    state.opciones.push(opcion);
    renderizarOpciones();
}

function eliminarOpcion(opcionId) {
    if (!confirm('¿Eliminar esta opción?')) {
        return;
    }

    state.opciones = state.opciones.filter(o => o.id !== opcionId);
    renderizarOpciones();
    showToast('Opción eliminada', 'success');
}

function renderizarOpciones() {
    const lista = document.getElementById('opciones-lista');
    const vacio = document.getElementById('opciones-vacio');

    if (state.opciones.length === 0) {
        lista.classList.add('hidden');
        vacio.classList.remove('hidden');
        return;
    }

    lista.classList.remove('hidden');
    vacio.classList.add('hidden');

    lista.innerHTML = state.opciones.map((opcion, index) => crearHTMLOpcion(opcion, index)).join('');
}

function crearHTMLOpcion(opcion, index) {
    const esIdBd = opcion.tipo_precio === 'id_bd';

    return `
        <div class="border border-gray-300 rounded-lg p-4 bg-gray-50" data-opcion-id="${opcion.id}">
            <div class="flex justify-between items-start mb-4">
                <h5 class="text-md font-bold text-gray-800">Opción ${index + 1}</h5>
                <button type="button" onclick="eliminarOpcion(${opcion.id})" class="text-red-600 hover:text-red-700 text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>

            <!-- Nombre de la Opción -->
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Opción</label>
                <input
                    type="text"
                    value="${opcion.nombre || ''}"
                    onchange="actualizarOpcion(${opcion.id}, 'nombre', this.value)"
                    placeholder="Ej: Una Hora, Consulta + PAP, etc."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required>
            </div>

            <!-- Tipo de Precio -->
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Precio</label>
                <select
                    onchange="actualizarOpcion(${opcion.id}, 'tipo_precio', this.value)"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="id_bd" ${esIdBd ? 'selected' : ''}>Desde Base de Datos (ID)</option>
                    <option value="fijo" ${!esIdBd ? 'selected' : ''}>Precio Fijo</option>
                </select>
            </div>

            <!-- Precios por ID de BD -->
            <div class="grid grid-cols-2 gap-4 ${esIdBd ? '' : 'hidden'}" id="opcion-${opcion.id}-id">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">ID Servicio Particular</label>
                    <input
                        type="number"
                        value="${opcion.id_servicio_particular || ''}"
                        onchange="actualizarOpcion(${opcion.id}, 'id_servicio_particular', parseInt(this.value) || null)"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">ID Servicio Club</label>
                    <input
                        type="number"
                        value="${opcion.id_servicio_club || ''}"
                        onchange="actualizarOpcion(${opcion.id}, 'id_servicio_club', parseInt(this.value) || null)"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>

            <!-- Precios Fijos -->
            <div class="grid grid-cols-2 gap-4 ${!esIdBd ? '' : 'hidden'}" id="opcion-${opcion.id}-fijo">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Particular ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        value="${opcion.precio_particular_fijo || ''}"
                        onchange="actualizarOpcion(${opcion.id}, 'precio_particular_fijo', parseFloat(this.value) || null)"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Club ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        value="${opcion.precio_club_fijo || ''}"
                        onchange="actualizarOpcion(${opcion.id}, 'precio_club_fijo', parseFloat(this.value) || null)"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
        </div>
    `;
}

function actualizarOpcion(opcionId, campo, valor) {
    const opcion = state.opciones.find(o => o.id === opcionId);
    if (!opcion) return;

    opcion[campo] = valor;

    // Si cambió el tipo de precio, re-renderizar para mostrar/ocultar campos
    if (campo === 'tipo_precio') {
        const esIdBd = valor === 'id_bd';
        document.getElementById(`opcion-${opcionId}-id`).classList.toggle('hidden', !esIdBd);
        document.getElementById(`opcion-${opcionId}-fijo`).classList.toggle('hidden', esIdBd);
    }

    console.log('Opción actualizada:', opcion);
}

// =============================================================================
// EXPONER FUNCIONES GLOBALES (para onclick en HTML)
// =============================================================================

window.agregarOpcion = agregarOpcion;
window.eliminarOpcion = eliminarOpcion;
window.actualizarOpcion = actualizarOpcion;
window.removeImage = removeImage;
window.handleImageUpload = handleImageUpload;
