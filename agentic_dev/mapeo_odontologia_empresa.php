<?php

// Mapeo de servicios odontológicos a IDs de tiposervicio
// Formato: 'NOMBRE_SERVICIO' => [[id, precio_club], [id, precio_club], ...]
// Precios del documento precios2.md (Sucursal Quito)

$mapeo_odontologia = [
    // ==========================================
    // CONSULTAS Y PREVENCIÓN
    // ==========================================
    'Primera Consulta (General)' => [
        [826, 3.99],  // Consulta odontología - mismo que Consulta Externa
    ],
    
    'Consulta Externa' => [
        [826, 3.99],  // Consulta odontología - 824 Precio más cercano a $5.00 particular REVISAR
    ],
    
    'Limpieza' => [
        [569, 17.50],  // Limpieza dental simple/grado 1 - $20.00 particular
        [570, 17.50],  // Limpieza dental grado 2 - $30.00 particular  
        [571, 17.50],  // Limpieza dental grado 3 - $40.00 particular
        [572, 17.50],  // Limpieza dental grado 4 - $50.00 particular
        [750, 17.50],  // Profilaxis -Limpieza Dental - $17.00 (precio Club: $25.00)
    ],
    
    'Limpieza + Fluorización' => [
        [746, 22.50],  // Limpieza+Fluor - $20.00 (precio doc: $25.00, $22.50) REVISAR
    ],
    
    'Fluorización' => [
        [836, 13.00],  // Fluorización - $20.00 (precio doc: $15.00, $13.00) - NO ENCONTRADO precio exacto
    ],
    
    'Sellantes' => [
        [835, 13.00],  // Sellantes - $13.00 (precio doc: $15.00, $13.00)
    ],
    
    'Blanqueamiento dental + Limpieza' => [
        [798, 13.00],  // $50 - precio doc: $85.00, $80.00 revisar
    ],
    
    // ==========================================
    // RESTAURACIONES
    // ==========================================
    'Restauración Simple' => [
        [819, 17.00],  // Restauracion Simple - precio doc: $20.00, $17.00
    ],
    
    'Restauración compuesta' => [
        [880, 23.00],  // Restauración compuesta - $23.00 (precio doc: $25.00, $23.00)
    ],
    
    'Restauración Compleja' => [
        [818, 27.00],  // Restauración compleja - $30.00 (precio doc: $30.00, $27.00)
    ],
    
    'Medicación Provisional' => [
        [758, 16.00],  // Medicación Provisional - $15.00 (precio doc: $17.00, $16.00) - NO precio exacto
    ],
    
    'Incrustación Resina' => [
        [754, 80.00],  // Incrustacion - $85.00 (precio doc: $85.00, $80.00)
    ],
    
    'Carillas Resina' => [
        [825, 65.00],  // Carillas dentales - $45.00 (precio doc: $70.00, $65.00) - NO precio exacto
    ],
    
    // ==========================================
    // EXTRACCIONES
    // ==========================================
    'Extracción dental simple' => [
        [573, 25.00],  // Extracción pieza dental grado 1 - $20.00 (precio doc: $28.00, $25.00) - NO precio exacto
    ],
    
    'Extracción dental compleja' => [
        [574, 30.00],  // Extracción pieza dental grado 2 - $25.00 (precio doc: $35.00, $30.00) - NO precio exacto
    ],
    
    // ==========================================
    // CIRUGÍAS
    // ==========================================
    'Terceros molares' => [
        [775, 45.00],  // Cirugía Tercero Molares - $90.00 (precio doc: $50.00, $45.00) - NO precio exacto
    ],
    
    'Terceros molares Incluidos' => [
        [799, 65.00],  // Extracción de Terceros Molares - $175.00 (precio doc: $70.00, $65.00) - NO precio exacto
    ],
    
    'Alargamiento de coronas' => [
        [745, 75.00],  // Alargamiento Dental - $50.00 (precio doc: $80.00, $75.00) - NO precio exacto
    ],
    
    'Bichectomía' => [
        // NO ENCONTRADO EN BASE DE DATOS - precio doc: $250.00, $240.00
    ],
    
    // ==========================================
    // ENDODONCIA
    // ==========================================
    'Endodoncia Uniradicular' => [
        [876, 140.00],  // Endodoncia - $150.00 (precio doc: $150.00, $140.00)
    ],
    
    'Endodoncia multiradicular' => [
        [876, 165.00],  // Endodoncia - $150.00 (precio doc: $180.00, $165.00) - NO precio exacto, mismo ID
    ],
    
    // ==========================================
    // REHABILITACIÓN ORAL
    // ==========================================
    'Pernos de Fibra + Corona Porcelana' => [
        // NO ENCONTRADO EN BASE DE DATOS - precio doc: $180.00, $175.00
    ],
    
    'Coronas Metal Porcelana' => [
        // NO ENCONTRADO EN BASE DE DATOS - precio doc: $160.00, $155.00
    ],
    
    'Prótesis total' => [
        [891, 185.00],  // Prótesis dental - $50.00 (precio doc: $190.00, $185.00) - NO precio exacto
    ],
    
    'Prótesis parcial removible cromo cobalto' => [
        // NO ENCONTRADO EN BASE DE DATOS - precio doc: $220.00, $210.00
    ],
    
    // ==========================================
    // ODONTOPEDIATRÍA
    // ==========================================
    'Pulpectomía' => [
        [816, 120.00],  // Pulpectomia - $30.00 (precio doc: $125.00, $120.00) - NO precio exacto
    ],
    
    'Mantenedor de espacio' => [
        // NO ENCONTRADO EN BASE DE DATOS - precio doc: $130.00, $125.00
    ],
      
    'Consulta con Especialista' => [
        [824, 25.00],  // Consulta odontología - $15.00 (precio doc: $30.00, $25.00) - NO precio exacto
    ],
    
    'Sellantes (Odontopediatría)' => [
        [835, 13.00],  // Sellantes - mismo que arriba
    ],
    
    // ==========================================
    // ORTODONCIA
    // ==========================================
    'Convencional' => [
        [794, 155.00],  // Ortodoncia - $150.00 (precio doc: $160.00, $155.00)
    ],
    
    'Control Convencional' => [
        [751, 35.00],  // Control Ortodoncia - $40.00 (precio doc: $40.00, $35.00)
    ],
    
    'Autoligado' => [
        // NO ENCONTRADO EN BASE DE DATOS - precio doc: $180.00, $175.00
    ],
    
    'Control Autoligado' => [
        [765, 42.00],  // Control Ortodoncia/ Brackets - $35.00 (precio doc: $45.00, $42.00) - NO precio exacto
    ],
];

?>
