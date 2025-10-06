<?php
// Versión final para generar horarios médicos
require_once 'db_connect.inc.php';

echo "🗓️ Generando horarios médicos (versión final)...\n";

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
    
    $totalHorariosCreados = 0;
    $totalRelacionesCreadas = 0;
    
    // Primero crear horarios únicos por fecha y hora
    echo "📅 Creando horarios únicos...\n";
    $horariosUnicos = [];
    $fechaActual = clone $fechaInicio;
    
    while ($fechaActual <= $fechaFin) {
        // Solo lunes a viernes
        $diaSemana = $fechaActual->format('N');
        if ($diaSemana >= 1 && $diaSemana <= 5) {
            $fecha = $fechaActual->format('Y-m-d');
            
            // Crear horarios únicos para esta fecha
            $horarios = ['09:00:00', '10:30:00', '14:00:00', '15:30:00'];
            
            foreach ($horarios as $hora) {
                // Verificar si ya existe este horario
                $horarioExistente = $conn->query("
                    SELECT idHorario FROM horario 
                    WHERE fechaHorario = '$fecha' AND hora = '$hora'
                ")->fetch();
                
                if (!$horarioExistente) {
                    // Insertar horario único
                    $stmtHorario = $conn->prepare("
                        INSERT INTO horario (fechaHorario, hora, usuario, fecha, ip) 
                        VALUES (?, ?, 1, NOW(), '127.0.0.1')
                    ");
                    $stmtHorario->execute([$fecha, $hora]);
                    $idHorario = $conn->lastInsertId();
                    $horariosUnicos[$fecha . '-' . $hora] = $idHorario;
                    $totalHorariosCreados++;
                } else {
                    $horariosUnicos[$fecha . '-' . $hora] = $horarioExistente['idHorario'];
                }
            }
        }
        
        $fechaActual->modify('+1 day');
    }
    
    echo "✅ Horarios únicos creados: $totalHorariosCreados\n";
    
    // Ahora asignar horarios a médicos
    echo "👨‍⚕️ Asignando horarios a médicos...\n";
    
    foreach ($medicos as $medico) {
        $idMedico = $medico['idMedico'];
        $idDispensario = $medico['idDispensario'];
        
        // Asignar algunos horarios aleatorios a cada médico
        $horariosAsignados = 0;
        $maxHorariosPorMedico = 8; // Máximo 8 horarios por médico
        
        foreach ($horariosUnicos as $key => $idHorario) {
            // Asignar aleatoriamente algunos horarios (50% de probabilidad)
            if (rand(0, 1) === 1 && $horariosAsignados < $maxHorariosPorMedico) {
                // Verificar si ya existe esta relación
                $relacionExistente = $conn->query("
                    SELECT idHorarioMedico FROM horariomedico 
                    WHERE idHorario = $idHorario AND idMedico = $idMedico
                ")->fetch();
                
                if (!$relacionExistente) {
                    // Insertar relación médico-horario
                    $stmtHorarioMedico = $conn->prepare("
                        INSERT INTO horariomedico (idHorario, idMedico, idDispensario, idEstado, usuario, fecha, ip) 
                        VALUES (?, ?, ?, 1, 1, NOW(), '127.0.0.1')
                    ");
                    $stmtHorarioMedico->execute([$idHorario, $idMedico, $idDispensario]);
                    $totalRelacionesCreadas++;
                    $horariosAsignados++;
                }
            }
        }
    }
    
    echo "\n✅ ¡Proceso completado!\n";
    echo "📊 Estadísticas:\n";
    echo "   - Horarios únicos creados: $totalHorariosCreados\n";
    echo "   - Relaciones médico-horario: $totalRelacionesCreadas\n";
    echo "   - Rango de fechas: " . $fechaInicio->format('Y-m-d') . " a " . $fechaFin->format('Y-m-d') . "\n";
    echo "   - Médicos procesados: " . count($medicos) . "\n";
    
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
    
    // Verificar total de horarios disponibles
    $totalDisponibles = $conn->query("
        SELECT COUNT(*) as total FROM horariomedico hm
        JOIN horario h ON hm.idHorario = h.idHorario
        WHERE h.fechaHorario >= CURDATE()
    ")->fetch()['total'];
    
    echo "\n📊 Total de horarios disponibles: $totalDisponibles\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
