<?php
require_once 'config.php';
try {
    $pdo = getDbConnection();
    $stmt = $pdo->query("SELECT * FROM inventory ORDER BY name ASC");
    $items = $stmt->fetchAll();
    // Asegurar tipos numéricos
    $processed_items = array_map(function($item) {
        $item['quantity'] = (float) $item['quantity'];
        $item['lowStockThreshold'] = (float) $item['lowStockThreshold'];
        $item['costPerUnit'] = (float) $item['costPerUnit'];
        $item['correctionFactor'] = isset($item['correctionFactor']) ? (float)$item['correctionFactor'] : null;
        return $item;
    }, $items);
    echo json_encode($processed_items);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
}
?>
