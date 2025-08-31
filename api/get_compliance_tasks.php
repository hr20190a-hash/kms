<?php
require_once 'config.php';

try {
    $pdo = getDbConnection();

    $stmt = $pdo->query("SELECT * FROM compliance_tasks");
    $tasks = $stmt->fetchAll();

    $processed_tasks = array_map(function($task) {
        $task['documents'] = safe_json_decode($task['documents']);
        return $task;
    }, $tasks);

    echo json_encode($processed_tasks);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
}
?>
