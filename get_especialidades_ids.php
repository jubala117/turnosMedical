<?php
require_once('db_connect.inc.php');

try {
    $stmt = $conn->query('SELECT idEspecialidad, descEspecialidad FROM especialidad WHERE idDispensario = 2 AND idEstado = 1 ORDER BY idEspecialidad');
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== ESPECIALIDADES Y SUS IDs ===\n\n";
    foreach($results as $row) {
        echo 'ID: ' . $row['idEspecialidad'] . ' - ' . $row['descEspecialidad'] . "\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
