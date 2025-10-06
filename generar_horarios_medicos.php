<?php
// Script para generar horarios médicos desde hoy hasta 2 semanas adelante

require_once 'db_connect.inc.php';

echo "🗓️ Generando horarios médicos desde hoy hasta 2 semanas adelante...\n";

try {
    // Obtener todos los médicos
    $medicos = $conn->query("SELECT idMedico, idDispensario FROM medico")->fetchAll();
    echo "👨‍⚕️ Encontrados " . count($medicos) . " médicos\n";
    
    // Configurar fechas
    $fechaInicio = new DateTime();
    $fechaFin = new DateTime();
    $fechaFin->modify('+14 days');
    
    echo "📅 Rango de fechas: " . $fechaInicio->format('Y-m-d') . " a " . $fechaFin->format('Y-m-d') . "\n";
    
    // Horarios disponibles (mañana y tarde)
    $horariosMañana = ['08:00:00', '09:00:00', '10:00:00', '11:00:00'];
    $horariosTarde = ['14:00:00', '15:00:00', '16:00:00', '17:00:00'];
    
    $totalHorariosCreados = 0;
    $totalRelacionesCreadas = 0;
    
    // Limpiar horarios existentes (opcional - comentar si quieres mantener los existentes)
    echo "🧹 Limpiando horarios existentes...\n";
    $conn->exec("DELETE FROM horariomedico WHERE idHorario IN (SELECT idHorario FROM horario WHERE fechaHorario >= CURDATE())");
    $conn->exec("DELETE FROM horario WHERE fechaHorario >= CURDATE()");
    
    // Generar horarios para cada médico
    foreach ($medicos as $medico) {
        $idMedico = $medico['idMedico'];
        $idDispensario = $medico['idDispensario'];
        
        echo "👨‍⚕️ Procesando médico ID: $idMedico\n";
        
        $fechaActual = clone $fechaInicio;
        
        while ($fechaActual <= $fechaFin) {
            // Solo lunes a viernes (1 = lunes, 5 = viernes)
            $diaSemana = $fechaActual->format('N');
            if ($diaSemana >= 1 && $diaSemana <= 5) {
                $fecha = $fechaActual->format('Y-m-d');
                
                // Determinar qué horarios asignar (algunos días mañana, otros tarde, algunos ambos)
                $horariosDelDia = [];
                
                if ($diaSemana % 2 == 0) {
                    // Días pares: solo mañana
                    $horariosDelDia = $horariosMañana;
                } else if ($diaSemana % 3 == 0) {
                    // Días divisibles por 3: solo tarde
                    $horariosDelDia = $horariosTarde;
                } else {
                    // Otros días: ambos turnos
                    $horariosDelDia = array_merge($horariosMañana, $horariosTarde);
                }
                
                // Crear horarios para este día
                foreach ($horariosDelDia as $hora) {
                    // Insertar en tabla horario
                    $stmtHorario = $conn->prepare("
                        INSERT INTO horario (fechaHorario, hora, usuario, fecha, ip) 
                        VALUES (?, ?, 1, NOW(), '127.0.0.1')
                    ");
                    $stmtHorario->execute([$fecha, $hora]);
                    $idHorario = $conn->lastInsertId();
                    
                    // Insertar en tabla horariomedico (usar idEstado = 1 que es válido)
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
    echo "   - Médicos procesados: " . count($medicos) . "\n";
    
    // Verificar valores válidos para idEstado
    echo "\n🔍 Verificando valores válidos para idEstado:\n";
    $estados = $conn->query("SELECT idEstado, descripcion FROM estado")->fetchAll();
    foreach ($estados as $estado) {
        echo "   - ID: {$estado['idEstado']}, Descripción: {$estado['descripcion']}\n";
    }
    
    // Verificar algunos horarios creados
    echo "\n🔍 Verificando horarios creados (primeros 5):\n";
    $horariosCreados = $conn->query("
        SELECT h.idHorario, h.fechaHorario, h.hora, hm.idMedico 
        FROM horario h 
        JOIN horariomedico hm ON h.idHorario = hm.idHorario 
        WHERE h.fechaHorario >= CURDATE() 
        ORDER BY h.fechaHorario, h.hora 
        LIMIT 5
    ")->fetchAll();
    
    foreach ($horariosCreados as $horario) {
        echo "   - Fecha: {$horario['fechaHorario']}, Hora: {$horario['hora']}, Médico: {$horario['idMedico']}\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
