<?php
require 'config.php';

// Obtener la conexión PDO
$pdo = getDbConnection(); // Call the function to get the PDO object

$suppliers = [];

$sql = "SELECT id, name, contactPerson, phone, email, address, categories FROM suppliers ORDER BY name ASC";
try {
    $stmt = $pdo->query($sql); // Use PDO's query method
    $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch all results

    // Process categories field
    foreach ($suppliers as &$row) {
        $row['categories'] = json_decode($row['categories']) ?: [];
    }
    unset($row); // Break the reference with the last element

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en la consulta SQL para obtener proveedores: " . $e->getMessage()]);
    exit();
}

echo json_encode($suppliers);

// PDO no necesita $conn->close() explícito.

?>
