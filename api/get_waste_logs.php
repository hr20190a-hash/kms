<?php
require 'config.php';

// Obtener la conexión PDO
$pdo = getDbConnection(); // Call the function to get the PDO object

$waste_logs = [];

$sql = "SELECT id, date, dish, ingredient, quantity, unit, reason, observations FROM waste_logs ORDER BY date DESC";
try {
    $stmt = $pdo->query($sql); // Use PDO's query method
    $waste_logs = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch all results

    // Ensure 'quantity' is float
    foreach ($waste_logs as &$row) {
        $row['quantity'] = floatval($row['quantity']);
    }
    unset($row); // Break the reference with the last element

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta SQL para obtener registros de desperdicio: " . $e->getMessage()]);
    exit();
}

echo json_encode($waste_logs);

// PDO no necesita $conn->close() explícito, se cierra automáticamente al finalizar el script o cuando el objeto es destruido.
// $conn->close(); // Remove this line

?>
