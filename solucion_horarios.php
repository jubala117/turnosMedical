<?php
// Solución alternativa para generar horarios médicos
require_once 'db_connect.inc.php';

echo "🛠️ Solución alternativa para generar horarios médicos...\n";

try {
    // Verificar si existe la tabla estado
    $tablaExiste = $conn->query("SHOW TABLES LIKE 'estado'")->fetch();
    
    if (!$tablaExiste) {
        echo "📋 Creando tabla estado...\n";
        $conn->exec("
            CREATE TABLE estado (
                idEstado INT PRIMARY KEY,
                descripcion VARCHAR(100)
            )
        ");
        
        // Insertar estados básicos
        $conn->exec("INSERT INTO estado (idEstado, descripcion) VALUES (1, 'Disponible')");
        $conn->exec("INSERT INTO estado (idEstado, descripcion) VALUES (2, 'Ocupado')");
        echo "✅ Tabla estado creada con estados básicos\n";
    } else {
        echo "✅ Tabla estado ya existe\n";
    }
    
    // Obtener todos los médicos
    $medicos = $conn->query("SELECT idMedico, idDispensario FROM medico")->fetchAll();
    echo "👨‍⚕️ Encontrados " . count($medicos) . " médicos\n";
    
    // Configurar fechas
    $fechaInicio = new DateTime();
    $fechaFin = new DateTime();
    $fechaFin->modify('+14 days');
    
    echo "📅 Rango de fechas: " . $fechaInicio->format('Y-m-d') . " a " . $fechaFin->format('Y-m-d') . "\n";
    
    // Limpiar horarios existentes
    echo "🧹 Limpiando horarios existentes...\n";
    $conn->exec("DELETE FROM horariomedico WHERE idHorario IN (SELECT idHorario FROM horario WHERE fechaHorario >= CURDATE())");
    $conn->exec("DELETE FROM horario WHERE fechaHorario >= CURDATE()");
    
    // Generar horarios para un subconjunto de médicos (para prueba)
    $medicosLimitados = array_slice($medicos, 0, 10); // Solo primeros 10 médicos para prueba
    echo "👨‍⚕️ Procesando " . count($medicosLimitados) . " médicos (para prueba)...\n";
    
    $totalHorariosCreados = 0;
    $totalRelacionesCreadas = 0;
    
    foreach ($medicosLimitados as $medico) {
        $idMedico = $medico['idMedico'];
        $idDispensario = $medico['idDispensario'];
        
        echo "👨‍⚕️ Procesando médico ID: $idMedico\n";
        
        $fechaActual = clone $fechaInicio;
        
        while ($fechaActual <= $fechaFin) {
            // Solo lunes a viernes
            $diaSemana = $fechaActual->format('N');
            if ($diaSemana >= 1 && $diaSemana <= 5) {
                $fecha = $fechaActual->format('Y-m-d');
                
                // Crear 2 horarios por día (mañana y tarde)
                $horarios = ['09:00:00', '15:00:00'];
                
                foreach ($horarios as $hora) {
                    // Insertar en tabla horario
                    $stmtHorario = $conn->prepare("
                        INSERT INTO horario (fechaHorario, hora, usuario, fecha, ip) 
                        VALUES (?, ?, 1, NOW(), '127.0.0.1')
                    ");
                    $stmtHorario->execute([$fecha, $hora]);
                    $idHorario = $conn->lastInsertId();
                    
                    // Insertar en tabla horariomedico
                    $stmtHorarioMedico = $conn->prepare("
                        INSERT INTO horariomedico (idHorario, idMedico, idDispensario, idEstado, usuario, fecha, ip) 
                        VALUES (?, ?, ?, 1, 1, NOW(), '127.0.0.1')
                    ");
                    $stmtHorarioMedico->execute([$idHorario, $idMedico, $idDispensario]);
                    
                    $totalHorariosCreados++;
                    $totalRelacionesCreadas++;
                }
            }
            
            $fechaActual->modify('+1 day');
        }
    }
    
    echo "\n✅ ¡Proceso completado!\n";
    echo "📊 Estadísticas:\n";
    echo "   - Horarios creados: $totalHorariosCreados\n";
    echo "   - Relaciones médico-horario: $totalRelacionesCreadas\n";
    echo "   - Rango de fechas: " . $fechaInicio->format('Y-m-d') . " a " . $fechaFin->format('Y-m-d') . "\n";
    echo "   - Médicos procesados: " . count($medicosLimitados) . "\n";
    
    // Verificar horarios creados
    echo "\n🔍 Verificando horarios creados:\n";
    $horariosCreados = $conn->query("
        SELECT h.idHorario, h.fechaHorario, h.hora, hm.idMedico 
        FROM horario h 
        JOIN horariomedico hm ON h.idHorario = hm.idHorario 
        WHERE h.fechaHorario >= CURDATE() 
        ORDER BY h.fechaHorario, h.hora 
        LIMIT 10
    ")->fetchAll();
    
    foreach ($horariosCreados as $horario) {
        echo "   - Fecha: {$horario['fechaHorario']}, Hora: {$horario['hora']}, Médico: {$horario['idMedico']}\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
