<?php
// Script para actualizar horarios médicos con fechas desde hoy hasta 2 semanas adelante

require_once 'db_connect.inc.php';

echo "🔍 Analizando estructura de la base de datos...\n";

try {
    // 1. Analizar estructura de las tablas
    echo "📊 Tablas encontradas:\n";
    $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "   - $table\n";
    }
    
    // 2. Ver estructura de las tablas relevantes
    echo "\n📋 Estructura de tabla 'medico':\n";
    $medico_structure = $conn->query("DESCRIBE medico")->fetchAll();
    foreach ($medico_structure as $column) {
        echo "   - {$column['Field']} ({$column['Type']})\n";
    }
    
    echo "\n📋 Estructura de tabla 'horario':\n";
    $horario_structure = $conn->query("DESCRIBE horario")->fetchAll();
    foreach ($horario_structure as $column) {
        echo "   - {$column['Field']} ({$column['Type']})\n";
    }
    
    echo "\n📋 Estructura de tabla 'horariomedico':\n";
    $horariomedico_structure = $conn->query("DESCRIBE horariomedico")->fetchAll();
    foreach ($horariomedico_structure as $column) {
        echo "   - {$column['Field']} ({$column['Type']})\n";
    }
    
    // 3. Ver datos actuales
    echo "\n👨‍⚕️ Médicos existentes:\n";
    $medicos = $conn->query("SELECT idMedico, idUsuario FROM medico")->fetchAll();
    foreach ($medicos as $medico) {
        echo "   - ID: {$medico['idMedico']}, Usuario: {$medico['idUsuario']}\n";
    }
    
    echo "\n📋 Estructura de tabla 'persona':\n";
    $persona_structure = $conn->query("DESCRIBE persona")->fetchAll();
    foreach ($persona_structure as $column) {
        echo "   - {$column['Field']} ({$column['Type']})\n";
    }
    
    echo "\n📅 Horarios existentes (primeros 5):\n";
    $horarios = $conn->query("SELECT * FROM horario LIMIT 5")->fetchAll();
    foreach ($horarios as $horario) {
        echo "   - ID: {$horario['idHorario']}, Fecha: {$horario['fechaHorario']}, Hora: {$horario['hora']}\n";
    }
    
    echo "\n🔗 Relaciones horariomedico (primeros 5):\n";
    $relaciones = $conn->query("SELECT * FROM horariomedico LIMIT 5")->fetchAll();
    foreach ($relaciones as $relacion) {
        echo "   - ID: {$relacion['idHorarioMedico']}, Médico: {$relacion['idMedico']}, Horario: {$relacion['idHorario']}\n";
    }
    
    echo "\n✅ Análisis completado. Ahora procederé a crear el script de actualización.\n";
    
} catch (PDOException $e) {
    echo "❌ Error al analizar la base de datos: " . $e->getMessage() . "\n";
}
?>
