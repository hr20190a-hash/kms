<?php
require_once 'config.php';

try {
    $pdo = getDbConnection();
    
    $stmt = $pdo->query("SELECT * FROM recipes");
    $recipes = $stmt->fetchAll();

    // Procesar cada receta para decodificar los campos JSON y asegurar tipos correctos
    $processed_recipes = array_map(function($recipe) {
        // Decodificar campos que son JSON en la BD a arrays/objetos de PHP
        $recipe['ingredients'] = json_decode($recipe['ingredients'] ?? '[]', true);
        $recipe['steps'] = json_decode($recipe['steps'] ?? '[]', true);
        $recipe['tags'] = json_decode($recipe['tags'] ?? '[]', true);
        $recipe['allergens'] = json_decode($recipe['allergens'] ?? 'null', true);
        $recipe['co2Impact'] = json_decode($recipe['co2Impact'] ?? 'null', true);

        // Asegurar que los números sean números y no strings
        $recipe['servings'] = (int) $recipe['servings'];
        $recipe['prepTimeMinutes'] = (int) $recipe['prepTimeMinutes'];
        $recipe['cookTimeMinutes'] = (int) $recipe['cookTimeMinutes'];

        return $recipe;
    }, $recipes);

    echo json_encode($processed_recipes);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al consultar las recetas: ' . $e->getMessage()]);
}
?>
