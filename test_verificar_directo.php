<?php
require_once('db_connect.inc.php');

try {
    echo "=== PRUEBA DIRECTA DE LA CONSULTA ===\n\n";
    
    $cedula = '0502417025';
    
    // Consulta mejorada - detectar ISSFA y Club Medical
    $sql = "SELECT 
                p.idPersona, 
                CONCAT(p.nombres, ' ', p.apellidos) AS nombreCompleto,
                CASE 
                    WHEN tp.pacienteISSFA = 'S' THEN 1 
                    ELSE 0 
                END AS esISSFA,
                CASE 
                    WHEN pp.idPersonaPlan IS NOT NULL 
                         AND gp.idGrupoPlan = 7 
                         AND pp.fechaInicio <= NOW() 
                         AND (pp.fechaFin IS NULL OR pp.fechaFin >= NOW())
                    THEN 1 ELSE 0 
                END AS esClubMedical
            FROM persona p
            LEFT JOIN tipopaciente tp ON p.idTipoPaciente = tp.idTipoPaciente
            LEFT JOIN personaplan pp ON p.idPersona = pp.idPersona
            LEFT JOIN grupoplan gp ON pp.idGrupoPlan = gp.idGrupoPlan
            WHERE p.cedula = ?";
    
    echo "SQL: " . $sql . "\n";
    echo "Cédula: " . $cedula . "\n\n";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$cedula]);
    $paciente = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($paciente) {
        echo "✅ Paciente encontrado:\n";
        print_r($paciente);
        
        echo "\n=== RESULTADO FINAL ===\n";
        echo "ID: " . $paciente['idPersona'] . "\n";
        echo "Nombre: " . $paciente['nombreCompleto'] . "\n";
        echo "ISSFA: " . ($paciente['esISSFA'] ? 'SÍ' : 'NO') . "\n";
        echo "Club Medical: " . ($paciente['esClubMedical'] ? 'SÍ' : 'NO') . "\n";
        
        echo "\n=== JSON OUTPUT ===\n";
        $json = json_encode([
            "existe" => true,
            "idPersona" => (int)$paciente['idPersona'],
            "nombre" => $paciente['nombreCompleto'],
            "issfa" => (bool)$paciente['esISSFA'],
            "clubMedical" => (bool)$paciente['esClubMedical']
        ]);
        echo $json . "\n";
        
    } else {
        echo "❌ Paciente no encontrado\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Error Code: " . $e->getCode() . "\n";
    echo "Error Info: " . print_r($conn->errorInfo(), true) . "\n";
}
?>
