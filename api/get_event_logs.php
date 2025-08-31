<?php
require_once 'config.php';
try {
    $pdo = getDbConnection();
    $stmt = $pdo->query("SELECT * FROM event_logs ORDER BY date DESC");
    $logs = $stmt->fetchAll();
    $processed_logs = array_map(function($log) {
        $log['isCorrected'] = (bool) $log['isCorrected'];
        return $log;
    }, $logs);
    echo json_encode($processed_logs);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
}
?>
