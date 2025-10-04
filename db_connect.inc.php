<?php

$gestor='mysql';
$dbname = 'medicalcare';
$usuario = 'root';
$pwd = '';
$host='localhost';

$dsn = $gestor.':dbname='.$dbname.';host='.$host;
try
{
    // Configuración de conexión persistente para connection pooling
    $options = array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_PERSISTENT => true,  // Habilita la conexión persistente
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
    );
        
    $conn = new PDO($dsn, $usuario, $pwd, $options);
}
catch (PDOException $e)
{
    die('Invalid connection');
}

?>
