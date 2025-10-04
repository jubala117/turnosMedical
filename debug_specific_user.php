<?php
require_once('db_connect.inc.php');

$cedula = isset($_GET['cedula']) ? $_GET['cedula'] : '1723719421'; // Default to the user's example

echo "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><title>Depurar Plan de Persona</title>";
echo "<style>body { font-family: sans-serif; margin: 2em; } table { border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; } .fail { color: red; font-weight: bold; } .pass { color: green; }</style>";
echo "</head><body>";
echo "<h1>Depurando el Plan para la Cédula: " . htmlspecialchars($cedula) . "</h1>";

try {
    // 1. Get idPersona
    $stmtPersona = $conn->prepare("SELECT idPersona, nombres, apellidos FROM persona WHERE cedula = :cedula");
    $stmtPersona->bindParam(':cedula', $cedula);
    $stmtPersona->execute();
    $persona = $stmtPersona->fetch(PDO::FETCH_ASSOC);

    if (!$persona) {
        die("<p class='fail'>No se encontró la persona con la cédula " . htmlspecialchars($cedula) . "</p></body></html>");
    }
    $idPersona = $persona['idPersona'];
    echo "<p>Persona encontrada: " . htmlspecialchars($persona['nombres'] . ' ' . $persona['apellidos']) . " (ID: $idPersona)</p>";

    // 2. Get plan details from personaPlan
    $sql = "SELECT * FROM personaPlan WHERE idPersona = :idPersona ORDER BY fechaInicio DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':idPersona', $idPersona);
    $stmt->execute();
    $planes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($planes) > 0) {
        echo "<h2>Planes asociados a esta persona:</h2>";
        foreach ($planes as $plan) {
            echo "<h3>Plan ID (idPersonaPlan): " . htmlspecialchars($plan['idPersonaPlan']) . "</h3>";
            echo "<table>";
            echo "<tr><th>Campo</th><th>Valor en la Base de Datos</th><th>Evaluación (para Club Medical)</th></tr>";

            // Check idGrupoPlan
            $idGrupoPlan = $plan['idGrupoPlan'];
            $evalGrupo = ($idGrupoPlan == 15) ? "<span class='pass'>Correcto (es 15)</span>" : "<span class='fail'>Incorrecto (es $idGrupoPlan, se esperaba 15)</span>";
            echo "<tr><td>idGrupoPlan</td><td>" . htmlspecialchars($idGrupoPlan) . "</td><td>$evalGrupo</td></tr>";

            // Check idEstadoPlan
            $idEstadoPlan = $plan['idEstadoPlan'];
            $evalEstado = ($idEstadoPlan == 1) ? "<span class='pass'>Activo (es 1)</span>" : "<span class='fail'>Inactivo (es $idEstadoPlan, se esperaba 1)</span>";
            echo "<tr><td>idEstadoPlan</td><td>" . htmlspecialchars($idEstadoPlan) . "</td><td>$evalEstado</td></tr>";

            // Check fechaInicio
            $fechaInicio = $plan['fechaInicio'];
            $evalInicio = (strtotime($fechaInicio) <= time()) ? "<span class='pass'>Válida (está en el pasado)</span>" : "<span class='fail'>Inválida (está en el futuro)</span>";
            echo "<tr><td>fechaInicio</td><td>" . htmlspecialchars($fechaInicio) . "</td><td>$evalInicio</td></tr>";

            // Check fechaFinalizacion
            $fechaFinalizacion = $plan['fechaFinalizacion'];
            $evalFinalizacion = (strtotime($fechaFinalizacion) >= time()) ? "<span class='pass'>Válida (está en el futuro)</span>" : "<span class='fail'>Inválida (está en el pasado)</span>";
            echo "<tr><td>fechaFinalizacion</td><td>" . htmlspecialchars($fechaFinalizacion) . "</td><td>$evalFinalizacion</td></tr>";

            echo "</table>";
        }
    } else {
        echo "<p class='fail'>Esta persona no tiene ningún plan asociado directamente en la tabla 'personaPlan'.</p>";
        echo "<p>Nota: Aún podría ser integrante de un plan familiar, pero este script simplificado solo revisa los planes donde es titular.</p>";
    }

} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>Error de base deatos:</strong> " . $e->getMessage() . "</p>";
}

echo "</body></html>";
?>