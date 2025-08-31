<?php
require_once 'config.php';

try {
    $pdo = getDbConnection();

    $stmt = $pdo->query("SELECT * FROM saved_menus ORDER BY date DESC");
    $menus = $stmt->fetchAll();

    $processed_menus = array_map(function($menu) {
        $menu['recipeIds'] = safe_json_decode($menu['recipeIds']);
        return $menu;
    }, $menus);

    echo json_encode($processed_menus);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
}
?>
