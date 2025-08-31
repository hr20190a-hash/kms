<?php
// Muestra todos los errores de PHP (¡MUY IMPORTANTE para depurar!)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
define('DB_HOST', 'localhost'); // Generalmente 'localhost' en Hostinger
define('DB_NAME', 'u210079785_pfkms');
define('DB_USER', 'u210079785_adminkms');
define('DB_PASS', '112501?Hugo');
define('DB_CHARSET', 'utf8mb4');

// --- CONFIGURACIÓN DE LA API DE GEMINI ---
// NO EXPONER ESTA CLAVE EN EL FRONTEND
define('GEMINI_API_KEY', 'AIzaSyCHm270J3Um7DmRwvjqkA5tsefXSYh_9ZE');

// Configuración de la cabecera para respuestas JSON
header('Content-Type: application/json');

// --- FUNCIÓN DE CONEXIÓN A LA BASE DE DATOS (PDO) ---
function getDbConnection() {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (\PDOException $e) {
        // En un entorno de producción, registrarías este error en lugar de mostrarlo
        http_response_code(500);
        echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
        exit; // Detiene la ejecución del script si la conexión falla
    }
}
?>
